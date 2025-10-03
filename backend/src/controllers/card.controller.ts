import { Request, Response } from 'express';
import { SavedCard, ISavedCard } from '../models/SavedCard';
import { User, IUser } from '../models/User';
import { encryptionService } from '../services/encryption.service';
import { getCardBrand } from '../utils/paymentValidation';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { cardValidationService } from '../services/cardValidation.service';
import { env } from '../config/env';

interface CardResponse {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    code?: string;
  };
}

class CardController {
  // Buscar todos os cartões salvos do usuário
  getUserCards = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;

    const cards = await SavedCard.find({ userId: user._id }).sort({ createdAt: -1 });

    const response: CardResponse = {
      success: true,
      data: cards.map(card => card.toJSON())
    };

    res.json(response);
  });

  // Salvar um novo cartão
  saveCard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const { cardNumber, cardHolderName, expirationMonth, expirationYear, cvv, isDefault } = req.body;

    try {
  // Guarda defensiva caso o middleware de validação tenha sido pulado ou payload esteja incorreto
      if (!cardNumber || !cvv || !cardHolderName || !expirationMonth || !expirationYear) {
        throw new AppError('Campos obrigatórios do cartão ausentes', 400, 'CARD_VALIDATION_MISSING_FIELDS');
      }

  // Verifica limite de cartões (máx. 5 por usuário)
      const cardCount = await SavedCard.countDocuments({ userId: user._id });
      if (cardCount >= 5) {
        throw new AppError('Máximo de 5 cartões por usuário atingido', 400, 'CARD_LIMIT_EXCEEDED');
      }

      const cardBrand = getCardBrand(cardNumber);

      // External validation (fail closed)
      try {
        const validation = await cardValidationService.validate({
          cardNumber,
          cardHolderName,
          expirationMonth,
          expirationYear,
          cvv,
          user: { id: user._id.toString(), email: user.email }
        });
        if (validation) { // validation null => bypass (no URL configured)
          if (!validation.valid) {
            throw new AppError('Cartão inválido', 400, 'CARD_EXTERNAL_INVALID');
          }
          // Optionally cross-check brand if provided
          if (validation.brand && validation.brand.toLowerCase() !== cardBrand) {
            // Apenas loga divergência (não bloqueia)
            if (!env.isProd) {
              console.warn('[CARD_VALIDATE] Divergência de bandeira local=', cardBrand, ' externa=', validation.brand);
            }
          }
          // Attach metadata for persistence later
          (req as any).externalCardValidationMeta = {
            provider: env.externalCardValidation.provider,
            validatedAt: new Date(),
            fraudScore: validation.fraudScore
          };
        }
      } catch (validationError) {
        if (validationError instanceof AppError) throw validationError;
        throw new AppError('Falha na validação externa do cartão', 502, 'CARD_VALIDATION_SERVICE_ERROR');
      }

  // Verifica se o usuário já possui este cartão (determinístico via últimos 4 + bandeira + validade)
      const existingCard = await SavedCard.findOne({
        userId: user._id,
        lastFourDigits: cardNumber.slice(-4),
        cardBrand,
        expirationMonth,
        expirationYear
      });

      if (existingCard) {
        throw new AppError('Este cartão já está salvo', 400, 'CARD_ALREADY_EXISTS');
      }

      const tokenizedCard = encryptionService.tokenizeCard({
        cardNumber,
        cardHolderName,
        expirationMonth,
        expirationYear
      });

      const savedCard = new SavedCard({
        userId: user._id,
  cardToken: tokenizedCard.token, // armazenar token determinístico
  encryptedData: tokenizedCard.encryptedData, // armazenar payload criptografado para detokenização futura
        lastFourDigits: tokenizedCard.lastFourDigits,
        cardBrand,
        cardHolderName,
        expirationMonth,
        expirationYear,
        isDefault: isDefault || false
      });

      // Persist external validation metadata if available
      const meta = (req as any).externalCardValidationMeta;
      if (meta) {
        (savedCard as any).externalValidation = meta;
      }

      await savedCard.save();

      const response: CardResponse = {
        success: true,
        data: {
          card: savedCard.toJSON(),
          message: 'Cartão salvo com sucesso'
        }
      };
      res.status(201).json(response);
    } catch (error: any) {
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        console.error('[CARD_SAVE_ERROR] Root cause:', error);
      }

  // Propaga AppError já classificado (evita perder o code)
      if (error instanceof AppError) {
        throw error;
      }

  // Chave duplicada (cardToken) -> cartão já existe
      if (error?.code === 11000) {
        throw new AppError('Este cartão já está salvo', 400, 'CARD_ALREADY_EXISTS');
      }

  // Cartão expirado detectado pelo hook pre-save
      if (error?.message && /Card has expired/i.test(error.message)) {
        throw new AppError('Cartão expirado', 400, 'CARD_EXPIRED');
      }

  // Tamanho da chave de criptografia inválido / chave ausente
      if (error?.message && /ENCRYPTION_KEY must be exactly 32 characters long/i.test(error.message)) {
        throw new AppError('Chave de criptografia inválida ou ausente (32 caracteres obrigatórios)', 500, 'ENCRYPTION_KEY_INVALID');
      }

  // Falha genérica de criptografia
      if (error?.message && /Encryption failed/i.test(error.message)) {
        throw new AppError('Falha no processo de criptografia', 500, 'ENCRYPTION_ERROR');
      }

  // Erro de validação do Mongoose (caso extremo)
      if (error?.name === 'ValidationError') {
        throw new AppError('Falha na validação do cartão na camada de persistência', 400, 'CARD_PERSIST_VALIDATION_ERROR');
      }

  // Fallback genérico
      const baseMessage = 'Falha ao salvar cartão';
      throw new AppError(
        isDev && error?.message ? `${baseMessage}: ${error.message}` : baseMessage,
        500,
        'CARD_SAVE_ERROR'
      );
    }
  });

  // Buscar cartão específico
  getCard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const { cardId } = req.params;

    const card = await SavedCard.findOne({
      _id: cardId,
      userId: user._id
    });

    if (!card) {
      throw new AppError('Cartão não encontrado', 404, 'CARD_NOT_FOUND');
    }

    const response: CardResponse = {
      success: true,
      data: {
        card: card.toJSON()
      }
    };

    res.json(response);
  });

  // Atualizar informações do cartão
  updateCard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const { cardId } = req.params;
    const { cardHolderName, isDefault } = req.body;

    const card = await SavedCard.findOne({
      _id: cardId,
      userId: user._id
    });

    if (!card) {
      throw new AppError('Card not found', 404, 'CARD_NOT_FOUND');
    }

  // Atualiza campos do cartão
    if (cardHolderName !== undefined) {
      card.cardHolderName = cardHolderName;
    }

    if (isDefault !== undefined) {
      card.isDefault = isDefault;
    }

    await card.save();

    const response: CardResponse = {
      success: true,
      data: {
        card: card.toJSON(),
        message: 'Cartão atualizado com sucesso'
      }
    };

    res.json(response);
  });

  // Excluir cartão
  deleteCard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const { cardId } = req.params;

    const card = await SavedCard.findOne({
      _id: cardId,
      userId: user._id
    });

    if (!card) {
      throw new AppError('Cartão não encontrado', 404, 'CARD_NOT_FOUND');
    }

    await SavedCard.findByIdAndDelete(cardId);

  // Se este era o cartão padrão, define outro como padrão
    if (card.isDefault) {
      const nextCard = await SavedCard.findOne({ userId: user._id });
      if (nextCard) {
        nextCard.isDefault = true;
        await nextCard.save();
      }
    }

    const response: CardResponse = {
      success: true,
      data: {
        message: 'Cartão removido com sucesso'
      }
    };

    res.json(response);
  });

  // Definir cartão como padrão
  setDefaultCard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const { cardId } = req.params;

    const card = await SavedCard.findOne({
      _id: cardId,
      userId: user._id
    });

    if (!card) {
      throw new AppError('Cartão não encontrado', 404, 'CARD_NOT_FOUND');
    }

  // Remove bandeira de padrão de todos os outros cartões
    await SavedCard.updateMany(
      { userId: user._id, _id: { $ne: cardId } },
      { isDefault: false }
    );

  // Define este cartão como padrão
    card.isDefault = true;
    await card.save();

    const response: CardResponse = {
      success: true,
      data: {
        card: card.toJSON(),
        message: 'Cartão definido como padrão com sucesso'
      }
    };

    res.json(response);
  });

  // Obter dados completos do cartão para processamento de pagamento (uso interno)
  getCardForPayment = asyncHandler(async (cardId: string, userId: string): Promise<{
    cardNumber: string;
    cardHolderName: string;
    expirationMonth: string;
    expirationYear: string;
  } | null> => {
    const card = await SavedCard.findOne({
      _id: cardId,
      userId
    });

    if (!card) {
      return null;
    }

    try {
    // Detokeniza dados do cartão para processamento
  // Usa encryptedData (não exposta no JSON) para detokenização
  const cardData = encryptionService.detokenizeCard((card as any).encryptedData);
      return cardData;
    } catch (error) {
      throw new AppError('Falha ao recuperar dados do cartão', 500, 'CARD_DECRYPT_ERROR');
    }
  });

  // Validar se o cartão pertence ao usuário
  validateCardOwnership = asyncHandler(async (cardId: string, userId: string): Promise<boolean> => {
    const card = await SavedCard.findOne({
      _id: cardId,
      userId
    });

    return !!card;
  });

  // Verificar se um cartão está expirado
  checkCardExpiration = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;

    const cards = await SavedCard.find({ userId: user._id });
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const expiredCards = cards.filter(card => {
      const expYear = parseInt(card.expirationYear);
      const expMonth = parseInt(card.expirationMonth);
      
      return expYear < currentYear || (expYear === currentYear && expMonth < currentMonth);
    });

    const expiringSoonCards = cards.filter(card => {
      const expYear = parseInt(card.expirationYear);
      const expMonth = parseInt(card.expirationMonth);
      const expirationDate = new Date(expYear, expMonth - 1);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      
      return expirationDate <= threeMonthsFromNow && expirationDate > now;
    });

    const response = {
      success: true,
      data: {
        expiredCards: expiredCards.map(card => card.toJSON()),
        expiringSoonCards: expiringSoonCards.map(card => card.toJSON()),
        totalCards: cards.length,
        expiredCount: expiredCards.length,
        expiringSoonCount: expiringSoonCards.length
      }
    };

    res.json(response);
  });

  // Obter estatísticas de cartões
  getCardStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;

    const stats = await SavedCard.aggregate([
      {
        $match: { userId: user._id }
      },
      {
        $group: {
          _id: null,
          totalCards: { $sum: 1 },
          cardBrands: { $addToSet: '$cardBrand' },
          defaultCard: {
            $sum: { $cond: [{ $eq: ['$isDefault', true] }, 1, 0] }
          },
          brandCounts: {
            $push: '$cardBrand'
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalCards: 0,
      cardBrands: [],
      defaultCard: 0,
      brandCounts: []
    };

  // Conta cartões por bandeira
    const brandCount = result.brandCounts.reduce((acc: any, brand: string) => {
      acc[brand] = (acc[brand] || 0) + 1;
      return acc;
    }, {});

    const response = {
      success: true,
      data: {
        totalCards: result.totalCards,
        supportedBrands: result.cardBrands,
        hasDefaultCard: result.defaultCard > 0,
        brandDistribution: brandCount,
        maxCardsAllowed: 5,
        remainingSlots: Math.max(0, 5 - result.totalCards)
      }
    };

    res.json(response);
  });

  // Excluir em lote cartões expirados
  deleteExpiredCards = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

  // Localizar cartões expirados
    const expiredCards = await SavedCard.find({
      userId: user._id,
      $or: [
        { expirationYear: { $lt: currentYear.toString() } },
        {
          expirationYear: currentYear.toString(),
          expirationMonth: { $lt: currentMonth.toString().padStart(2, '0') }
        }
      ]
    });

    if (expiredCards.length === 0) {
      const response: CardResponse = {
        success: true,
        data: {
          message: 'Nenhum cartão expirado encontrado',
          deletedCount: 0
        }
      };
  res.json(response);
    }

  // Remover cartões expirados
    const deleteResult = await SavedCard.deleteMany({
      _id: { $in: expiredCards.map(card => card._id) }
    });

  // Se um cartão padrão foi removido, definir outro como padrão
    const wasDefaultDeleted = expiredCards.some(card => card.isDefault);
    if (wasDefaultDeleted) {
      const remainingCard = await SavedCard.findOne({ userId: user._id });
      if (remainingCard) {
        remainingCard.isDefault = true;
        await remainingCard.save();
      }
    }

    const response: CardResponse = {
      success: true,
      data: {
        message: `${deleteResult.deletedCount} cartões expirados removidos com sucesso`,
        deletedCount: deleteResult.deletedCount,
        expiredCards: expiredCards.map(card => ({
          id: card._id,
          lastFourDigits: card.lastFourDigits,
          cardBrand: card.cardBrand,
          expirationMonth: card.expirationMonth,
          expirationYear: card.expirationYear
        }))
      }
    };

    res.json(response);
  });
}

export const cardController = new CardController();