"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardController = void 0;
const SavedCard_1 = require("../models/SavedCard");
const encryption_service_1 = require("../services/encryption.service");
const paymentValidation_1 = require("../utils/paymentValidation");
const errorHandler_1 = require("../middleware/errorHandler");
class CardController {
    constructor() {
        this.getUserCards = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const cards = await SavedCard_1.SavedCard.find({ userId: user._id }).sort({ createdAt: -1 });
            const response = {
                success: true,
                data: cards.map(card => card.toJSON())
            };
            res.json(response);
        });
        this.saveCard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const { cardNumber, cardHolderName, expirationMonth, expirationYear, cvv, isDefault } = req.body;
            try {
                if (!cardNumber || !cvv || !cardHolderName || !expirationMonth || !expirationYear) {
                    throw new errorHandler_1.AppError('Campos obrigatórios do cartão ausentes', 400, 'CARD_VALIDATION_MISSING_FIELDS');
                }
                const cardCount = await SavedCard_1.SavedCard.countDocuments({ userId: user._id });
                if (cardCount >= 5) {
                    throw new errorHandler_1.AppError('Máximo de 5 cartões por usuário atingido', 400, 'CARD_LIMIT_EXCEEDED');
                }
                const cardBrand = (0, paymentValidation_1.getCardBrand)(cardNumber);
                const existingCard = await SavedCard_1.SavedCard.findOne({
                    userId: user._id,
                    lastFourDigits: cardNumber.slice(-4),
                    cardBrand,
                    expirationMonth,
                    expirationYear
                });
                if (existingCard) {
                    throw new errorHandler_1.AppError('Este cartão já está salvo', 400, 'CARD_ALREADY_EXISTS');
                }
                const tokenizedCard = encryption_service_1.encryptionService.tokenizeCard({
                    cardNumber,
                    cardHolderName,
                    expirationMonth,
                    expirationYear
                });
                const savedCard = new SavedCard_1.SavedCard({
                    userId: user._id,
                    cardToken: tokenizedCard.token,
                    encryptedData: tokenizedCard.encryptedData,
                    lastFourDigits: tokenizedCard.lastFourDigits,
                    cardBrand,
                    cardHolderName,
                    expirationMonth,
                    expirationYear,
                    isDefault: isDefault || false
                });
                await savedCard.save();
                const response = {
                    success: true,
                    data: {
                        card: savedCard.toJSON(),
                        message: 'Cartão salvo com sucesso'
                    }
                };
                res.status(201).json(response);
            }
            catch (error) {
                const isDev = process.env.NODE_ENV !== 'production';
                if (isDev) {
                    console.error('[CARD_SAVE_ERROR] Root cause:', error);
                }
                if (error instanceof errorHandler_1.AppError) {
                    throw error;
                }
                if (error?.code === 11000) {
                    throw new errorHandler_1.AppError('Este cartão já está salvo', 400, 'CARD_ALREADY_EXISTS');
                }
                if (error?.message && /Card has expired/i.test(error.message)) {
                    throw new errorHandler_1.AppError('Cartão expirado', 400, 'CARD_EXPIRED');
                }
                if (error?.message && /ENCRYPTION_KEY must be exactly 32 characters long/i.test(error.message)) {
                    throw new errorHandler_1.AppError('Chave de criptografia inválida ou ausente (32 caracteres obrigatórios)', 500, 'ENCRYPTION_KEY_INVALID');
                }
                if (error?.message && /Encryption failed/i.test(error.message)) {
                    throw new errorHandler_1.AppError('Falha no processo de criptografia', 500, 'ENCRYPTION_ERROR');
                }
                if (error?.name === 'ValidationError') {
                    throw new errorHandler_1.AppError('Falha na validação do cartão na camada de persistência', 400, 'CARD_PERSIST_VALIDATION_ERROR');
                }
                const baseMessage = 'Falha ao salvar cartão';
                throw new errorHandler_1.AppError(isDev && error?.message ? `${baseMessage}: ${error.message}` : baseMessage, 500, 'CARD_SAVE_ERROR');
            }
        });
        this.getCard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const { cardId } = req.params;
            const card = await SavedCard_1.SavedCard.findOne({
                _id: cardId,
                userId: user._id
            });
            if (!card) {
                throw new errorHandler_1.AppError('Cartão não encontrado', 404, 'CARD_NOT_FOUND');
            }
            const response = {
                success: true,
                data: {
                    card: card.toJSON()
                }
            };
            res.json(response);
        });
        this.updateCard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const { cardId } = req.params;
            const { cardHolderName, isDefault } = req.body;
            const card = await SavedCard_1.SavedCard.findOne({
                _id: cardId,
                userId: user._id
            });
            if (!card) {
                throw new errorHandler_1.AppError('Card not found', 404, 'CARD_NOT_FOUND');
            }
            if (cardHolderName !== undefined) {
                card.cardHolderName = cardHolderName;
            }
            if (isDefault !== undefined) {
                card.isDefault = isDefault;
            }
            await card.save();
            const response = {
                success: true,
                data: {
                    card: card.toJSON(),
                    message: 'Cartão atualizado com sucesso'
                }
            };
            res.json(response);
        });
        this.deleteCard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const { cardId } = req.params;
            const card = await SavedCard_1.SavedCard.findOne({
                _id: cardId,
                userId: user._id
            });
            if (!card) {
                throw new errorHandler_1.AppError('Cartão não encontrado', 404, 'CARD_NOT_FOUND');
            }
            await SavedCard_1.SavedCard.findByIdAndDelete(cardId);
            if (card.isDefault) {
                const nextCard = await SavedCard_1.SavedCard.findOne({ userId: user._id });
                if (nextCard) {
                    nextCard.isDefault = true;
                    await nextCard.save();
                }
            }
            const response = {
                success: true,
                data: {
                    message: 'Cartão removido com sucesso'
                }
            };
            res.json(response);
        });
        this.setDefaultCard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const { cardId } = req.params;
            const card = await SavedCard_1.SavedCard.findOne({
                _id: cardId,
                userId: user._id
            });
            if (!card) {
                throw new errorHandler_1.AppError('Cartão não encontrado', 404, 'CARD_NOT_FOUND');
            }
            await SavedCard_1.SavedCard.updateMany({ userId: user._id, _id: { $ne: cardId } }, { isDefault: false });
            card.isDefault = true;
            await card.save();
            const response = {
                success: true,
                data: {
                    card: card.toJSON(),
                    message: 'Cartão definido como padrão com sucesso'
                }
            };
            res.json(response);
        });
        this.getCardForPayment = (0, errorHandler_1.asyncHandler)(async (cardId, userId) => {
            const card = await SavedCard_1.SavedCard.findOne({
                _id: cardId,
                userId
            });
            if (!card) {
                return null;
            }
            try {
                const cardData = encryption_service_1.encryptionService.detokenizeCard(card.encryptedData);
                return cardData;
            }
            catch (error) {
                throw new errorHandler_1.AppError('Falha ao recuperar dados do cartão', 500, 'CARD_DECRYPT_ERROR');
            }
        });
        this.validateCardOwnership = (0, errorHandler_1.asyncHandler)(async (cardId, userId) => {
            const card = await SavedCard_1.SavedCard.findOne({
                _id: cardId,
                userId
            });
            return !!card;
        });
        this.checkCardExpiration = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const cards = await SavedCard_1.SavedCard.find({ userId: user._id });
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
        this.getCardStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const stats = await SavedCard_1.SavedCard.aggregate([
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
            const brandCount = result.brandCounts.reduce((acc, brand) => {
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
        this.deleteExpiredCards = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            const expiredCards = await SavedCard_1.SavedCard.find({
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
                const response = {
                    success: true,
                    data: {
                        message: 'Nenhum cartão expirado encontrado',
                        deletedCount: 0
                    }
                };
                res.json(response);
            }
            const deleteResult = await SavedCard_1.SavedCard.deleteMany({
                _id: { $in: expiredCards.map(card => card._id) }
            });
            const wasDefaultDeleted = expiredCards.some(card => card.isDefault);
            if (wasDefaultDeleted) {
                const remainingCard = await SavedCard_1.SavedCard.findOne({ userId: user._id });
                if (remainingCard) {
                    remainingCard.isDefault = true;
                    await remainingCard.save();
                }
            }
            const response = {
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
}
exports.cardController = new CardController();
//# sourceMappingURL=card.controller.js.map