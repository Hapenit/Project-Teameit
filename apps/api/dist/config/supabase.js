"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserClient = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseServiceKey) {
    console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is not set.');
}
// Service role client for backend administrative actions
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
// A function to create a Supabase client that acts on behalf of the user, for RLS
const createUserClient = (authHeader) => {
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: authHeader,
            },
        },
        auth: {
            persistSession: false,
        }
    });
};
exports.createUserClient = createUserClient;
