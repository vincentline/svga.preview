/**
 * 乱码修复核心逻辑模块
 * 包含：文本评分、逆向解码 (GBK->UTF8, UTF8->GBK)、混合修复算法
 */

class GBKEncoder {
    constructor() {
        this.table = new Map();
        this.initialized = false;
        // 常见末尾汉字补全字典
        this.suffixDict = {
            'E4': ['中', '下', '主', '人', '件', '以', '会', '位', '作', '使', '保', '信'],
            'E5': ['出', '居', '域', '图', '告', '字', '实', '家', '区', '式'],
            'E6': ['显', '模', '清', '激', '消', '测', '淡', '态'],
            'E7': ['示', '码', '类', '箱', '空', '画'],
            'E8': ['行', '覆', '角', '设', '语', '该'],
            'E9': ['部', '页', '预', '题', '领', '风']
        };
    }

    init() {
        if (this.initialized) return;
        const decoder = new TextDecoder('gbk');
        const buffer = new Uint8Array(2);

        for (let b1 = 0x81; b1 <= 0xFE; b1++) {
            for (let b2 = 0x40; b2 <= 0xFE; b2++) {
                if (b2 === 0x7F) continue;

                buffer[0] = b1;
                buffer[1] = b2;
                const char = decoder.decode(buffer);

                if (char.length === 1 && !this.table.has(char)) {
                    this.table.set(char, [b1, b2]);
                }
            }
        }

        // Patch Euro (0x80)
        if (!this.table.has('€')) {
            this.table.set('€', [0x80]);
        }

        this.initialized = true;
    }

    encode(str) {
        if (!this.initialized) this.init();

        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const code = char.charCodeAt(0);

            if (code < 0x80) {
                bytes.push(code);
            } else {
                const gbkBytes = this.table.get(char);
                if (gbkBytes) {
                    for (let b of gbkBytes) bytes.push(b);
                } else {
                    if (code <= 0xFF) {
                        bytes.push(code);
                    } else {
                        bytes.push(0x3F); // ?
                    }
                }
            }
        }
        return new Uint8Array(bytes);
    }
}

const gbkEncoder = new GBKEncoder();

const GarbledFixer = {
    commonChars: "",
    encodingCandidates: ['gbk', 'big5', 'shift_jis', 'euc-kr', 'windows-1252', 'iso-8859-1'],

    init() {
        if (window.COMMON_CHARS_DATA) {
            this.commonChars = window.COMMON_CHARS_DATA;
        } else {
            this.commonChars = "的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样想向道命此位理望经发";
        }
        gbkEncoder.init();
    },

    getScore(text) {
        if (!text) return 0;
        let score = 0;
        let total = text.length;
        let chineseCount = 0;
        let commonCount = 0;
        let messCount = 0;
        let symbolCount = 0;

        const messRegex = /[à-ÿ]|[À-ß]|[\uFFFD]|[\x00-\x08\x0B\x0C\x0E-\x1F]/;
        const symbolRegex = /[^\w\s\u4e00-\u9fa5]/;

        for (let i = 0; i < total; i++) {
            const char = text[i];
            if (/[\u4e00-\u9fa5]/.test(char)) {
                chineseCount++;
                if (this.commonChars.includes(char)) {
                    commonCount++;
                }
            } else if (messRegex.test(char)) {
                messCount++;
            } else if (symbolRegex.test(char)) {
                symbolCount++;
            }
        }

        if (total === 0) return 0;
        if (total <= 4 && chineseCount === total) return 100;

        let effectiveLen = total - symbolCount;
        if (effectiveLen <= 0) effectiveLen = 1;

        score += (chineseCount / effectiveLen) * 60;
        score += (commonCount / effectiveLen) * 120;
        score -= (messCount / total) * 80;

        return score;
    },

    async fixText(text, forcedEncoding = null) {
        if (!text) return { text: '', encoding: null };
        if (!this.commonChars && window.COMMON_CHARS_DATA) this.init();

        if (forcedEncoding && forcedEncoding !== 'auto') {
            let res = this.reencode(text, forcedEncoding);
            if (res.encoding.startsWith('error')) {
                res = this.reverseDecode(text, forcedEncoding);
            }
            return res;
        }

        let bestResult = { text: text, score: this.getScore(text), encoding: 'original' };

        for (let enc of this.encodingCandidates) {
            let res = this.reverseDecode(text, enc);
            let score = this.getScore(res.text);

            if (score > bestResult.score + 10) {
                bestResult = { text: res.text, score: score, encoding: enc };
            }

            if (enc === 'gbk') {
                res = this.reencode(text, enc);
                score = this.getScore(res.text);

                if (score > bestResult.score + 10) {
                    bestResult = { text: res.text, score: score, encoding: enc + ' (Re-encode)' };
                }
            }
        }

        return bestResult;
    },

    reverseDecode(text, targetEncoding) {
        try {
            const encoder = new TextEncoder();
            const rawBytes = encoder.encode(text);
            const decoder = new TextDecoder(targetEncoding);
            return { text: decoder.decode(rawBytes), encoding: targetEncoding };
        } catch (e) {
            return { text: text, encoding: 'error' };
        }
    },

    reencode(text, targetEncoding) {
        if (targetEncoding.toLowerCase() !== 'gbk' && targetEncoding.toLowerCase() !== 'gb18030') {
            return { text: text, encoding: 'error-unsupported' };
        }

        try {
            const lines = text.split('\n');
            const fixedLines = lines.map(line => {
                if (!line.trim()) return line;

                const rawBytes = gbkEncoder.encode(line);
                const outputBytes = [];

                let i = 0;
                while (i < rawBytes.length) {
                    const b = rawBytes[i];

                    if (b < 0x80) {
                        outputBytes.push(b);
                        i++;
                        continue;
                    }

                    let needed = 0;
                    if ((b & 0xE0) === 0xC0) needed = 2;
                    else if ((b & 0xF0) === 0xE0) needed = 3;
                    else if ((b & 0xF8) === 0xF0) needed = 4;

                    if (needed > 0) {
                        let isTruncated = false;
                        let existing = [b];

                        for (let k = 1; k < needed; k++) {
                            if (i + k >= rawBytes.length) {
                                isTruncated = true;
                                break;
                            }
                            const nextB = rawBytes[i + k];
                            // Check valid continuation byte 10xxxxxx (0x80)
                            if ((nextB & 0xC0) !== 0x80) {
                                isTruncated = true;
                                break;
                            }
                            existing.push(nextB);
                        }

                        // FIX 1: E6 80 80 (Euro pollution) -> E6 80 81 (态)
                        if (existing.length === 3 && existing[0] === 0xE6 && existing[1] === 0x80 && existing[2] === 0x80) {
                            outputBytes.push(0xE6, 0x80, 0x81);
                            i += 3;
                            continue;
                        }

                        // FIX 2: E6 80 B6 (怶) -> E7 8A B6 (状) in context
                        if (existing.length === 3 && existing[0] === 0xE6 && existing[1] === 0x80 && existing[2] === 0xB6) {
                            outputBytes.push(0xE7, 0x8A, 0xB6);
                            i += 3;
                            continue;
                        }

                        if (isTruncated) {
                            const patch = this.tryPatch(existing);
                            if (patch) {
                                for (let pb of patch) outputBytes.push(pb);
                                i += existing.length;
                                if (i < rawBytes.length && rawBytes[i] === 0x3F) {
                                    i++;
                                }
                                continue;
                            }
                        } else {
                            // Valid UTF-8
                            for (let k = 0; k < needed; k++) outputBytes.push(rawBytes[i + k]);
                            i += needed;
                            continue;
                        }
                    }

                    // Fallback
                    outputBytes.push(b);
                    i++;
                }

                const decoder = new TextDecoder('utf-8');
                return decoder.decode(new Uint8Array(outputBytes));
            });

            return { text: fixedLines.join('\n'), encoding: targetEncoding };

        } catch (e) {
            console.error(e);
            return { text: text, encoding: 'error' };
        }
    },

    tryPatch(existingBytes) {
        if (existingBytes.length === 0) return null;
        const leadByte = existingBytes[0];

        if (leadByte < 0xE4 || leadByte > 0xE9) return null;

        const key = leadByte.toString(16).toUpperCase();
        const candidates = gbkEncoder.suffixDict[key];
        if (!candidates) return null;

        const encoder = new TextEncoder();
        for (let char of candidates) {
            const charBytes = encoder.encode(char);

            let match = true;
            for (let k = 0; k < existingBytes.length; k++) {
                if (existingBytes[k] !== charBytes[k]) {
                    match = false;
                    break;
                }
            }

            if (match) {
                return charBytes;
            }
        }
        return null;
    },

    async fixFileBuffer(arrayBuffer, forcedEncoding = null) {
        if (!this.commonChars && window.COMMON_CHARS_DATA) this.init();

        if (forcedEncoding && forcedEncoding !== 'auto') {
            try {
                const decoder = new TextDecoder(forcedEncoding);
                return { text: decoder.decode(arrayBuffer), encoding: forcedEncoding };
            } catch (e) { }
        }

        let bestResult = { text: '', score: -999, encoding: '' };
        try {
            const u8Text = new TextDecoder('utf-8').decode(arrayBuffer);
            bestResult = { text: u8Text, score: this.getScore(u8Text), encoding: 'utf-8' };
        } catch (e) { }

        for (let enc of this.encodingCandidates) {
            try {
                const decoder = new TextDecoder(enc);
                const text = decoder.decode(arrayBuffer);
                const score = this.getScore(text);
                if (score > bestResult.score) {
                    bestResult = { text: text, score: score, encoding: enc };
                }
            } catch (e) { }
        }
        return bestResult;
    }
};

window.GarbledFixer = GarbledFixer;
