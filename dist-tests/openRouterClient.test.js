var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var expect = require('chai').expect;
var sinon = require('sinon');
var OpenRouterClient = require('../openrouter').OpenRouterClient;
describe('OpenRouterClient', function () {
    var client;
    var fetchStub;
    var mockApiKey = 'test-api-key';
    beforeEach(function () {
        // Create a new client instance before each test
        client = new OpenRouterClient(mockApiKey);
        // Stub the global fetch function
        fetchStub = sinon.stub(global, 'fetch');
    });
    afterEach(function () {
        // Restore stub after each test
        fetchStub.restore();
    });
    describe('isHealthy', function () {
        it('should return true when listModels succeeds', function () { return __awaiter(_this, void 0, void 0, function () {
            var mockResponse, result, _a, url, options;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        mockResponse = {
                            ok: true,
                            json: function () { return Promise.resolve({ data: [{ id: 'model1', name: 'Test Model', context_length: 4096 }] }); }
                        };
                        fetchStub.resolves(mockResponse);
                        return [4 /*yield*/, client.isHealthy()];
                    case 1:
                        result = _b.sent();
                        // Verify the result is true
                        expect(result).to.be.true;
                        // Verify fetch was called with correct arguments
                        expect(fetchStub.calledOnce).to.be.true;
                        _a = fetchStub.firstCall.args, url = _a[0], options = _a[1];
                        expect(url).to.include('/models');
                        expect(options.headers.Authorization).to.equal("Bearer ".concat(mockApiKey));
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return false when listModels fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Setup mock response for failed API call
                        fetchStub.rejects(new Error('API connection error'));
                        return [4 /*yield*/, client.isHealthy()];
                    case 1:
                        result = _a.sent();
                        // Verify the result is false
                        expect(result).to.be.false;
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('chat', function () {
        it('should successfully call the API and return the response', function () { return __awaiter(_this, void 0, void 0, function () {
            var mockRequest, mockResponse, result, _a, url, options;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        mockRequest = {
                            model: 'test-model',
                            messages: [{ role: 'user', content: 'Hello' }]
                        };
                        mockResponse = {
                            ok: true,
                            json: function () { return Promise.resolve({
                                id: 'test-id',
                                object: 'chat.completion',
                                created: Date.now(),
                                model: 'test-model',
                                choices: [
                                    {
                                        index: 0,
                                        message: {
                                            role: 'assistant',
                                            content: 'Hello there!'
                                        },
                                        finish_reason: 'stop'
                                    }
                                ],
                                usage: {
                                    prompt_tokens: 10,
                                    completion_tokens: 15,
                                    total_tokens: 25
                                }
                            }); }
                        };
                        fetchStub.resolves(mockResponse);
                        return [4 /*yield*/, client.chat(mockRequest)];
                    case 1:
                        result = _b.sent();
                        // Verify the result
                        expect(result.id).to.equal('test-id');
                        expect(result.choices[0].message.content).to.equal('Hello there!');
                        // Verify fetch was called with correct arguments
                        expect(fetchStub.calledOnce).to.be.true;
                        _a = fetchStub.firstCall.args, url = _a[0], options = _a[1];
                        expect(url).to.include('/chat/completions');
                        expect(options.method).to.equal('POST');
                        expect(options.headers.Authorization).to.equal("Bearer ".concat(mockApiKey));
                        expect(JSON.parse(options.body).stream).to.be.false;
                        return [2 /*return*/];
                }
            });
        }); });
        it('should handle API errors correctly', function () { return __awaiter(_this, void 0, void 0, function () {
            var mockRequest, mockErrorResponse, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockRequest = {
                            model: 'test-model',
                            messages: [{ role: 'user', content: 'Hello' }]
                        };
                        mockErrorResponse = {
                            ok: false,
                            status: 401,
                            statusText: 'Unauthorized',
                            json: function () { return Promise.resolve({ error: 'Invalid API key' }); }
                        };
                        fetchStub.resolves(mockErrorResponse);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, client.chat(mockRequest)];
                    case 2:
                        _a.sent();
                        expect.fail('Should have thrown an error');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        expect(error_1.message).to.include('OpenRouter API error: 401');
                        expect(error_1.message).to.include('Invalid API key');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        it('should handle network errors correctly', function () { return __awaiter(_this, void 0, void 0, function () {
            var mockRequest, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockRequest = {
                            model: 'test-model',
                            messages: [{ role: 'user', content: 'Hello' }]
                        };
                        fetchStub.rejects(new Error('Network error'));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, client.chat(mockRequest)];
                    case 2:
                        _a.sent();
                        expect.fail('Should have thrown an error');
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        expect(error_2.message).to.include('Failed to connect to OpenRouter: Network error');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    });
    describe('listModels', function () {
        it('should return models when API call is successful', function () { return __awaiter(_this, void 0, void 0, function () {
            var mockModels, mockResponse, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockModels = {
                            data: [
                                { id: 'model1', name: 'Model 1', context_length: 4096 },
                                { id: 'model2', name: 'Model 2', context_length: 8192 }
                            ]
                        };
                        mockResponse = {
                            ok: true,
                            json: function () { return Promise.resolve(mockModels); }
                        };
                        fetchStub.resolves(mockResponse);
                        return [4 /*yield*/, client.listModels()];
                    case 1:
                        result = _a.sent();
                        expect(result.data).to.deep.equal(mockModels.data);
                        expect(fetchStub.calledOnce).to.be.true;
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return empty data array when API call fails', function () { return __awaiter(_this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fetchStub.rejects(new Error('API error'));
                        return [4 /*yield*/, client.listModels()];
                    case 1:
                        result = _a.sent();
                        expect(result.data).to.deep.equal([]);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
