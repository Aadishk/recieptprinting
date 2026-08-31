/**
 * Manglish (English to Malayalam) Transliteration Engine & UI Handler
 * Supports both offline phonetic rule-based transliteration and Google Input Tools API suggestions.
 */

(function () {
    // --- OFFLINE PHONETIC MAP & ENGINE ---
    const VOWELS = {
        'aa': 'ആ', 'a': 'അ', 'ii': 'ഈ', 'ee': 'ഈ', 'i': 'ഇ',
        'uu': 'ഊ', 'oo': 'ഊ', 'u': 'ഉ', 'r~': 'ഋ',
        'ai': 'ഐ', 'ei': 'ഏ', 'e': 'എ', 'E': 'ഏ',
        'au': 'ഔ', 'ou': 'ഔ', 'o': 'ഒ', 'O': 'ഓ',
        'am': 'അം', 'ah': 'അഃ'
    };

    const VOWEL_MATRAS = {
        'aa': 'ാ', 'a': '', 'ii': 'ീ', 'ee': 'ീ', 'i': 'ി',
        'uu': 'ൂ', 'oo': 'ൂ', 'u': 'ു', 'r~': 'ൃ',
        'ai': 'ൈ', 'ei': 'േ', 'e': 'െ', 'E': 'േ',
        'au': 'ൌ', 'ou': 'ൌ', 'o': 'ൊ', 'O': 'ോ',
        'am': 'ം', 'ah': 'ഃ'
    };

    // Sorted by length descending for greedy matching
    const CONSONANTS = [
        { en: 'chha', ml: 'ഛ' }, { en: 'kh', ml: 'ഖ' }, { en: 'gh', ml: 'ഘ' },
        { en: 'ng', ml: 'ങ' }, { en: 'ch', ml: 'ച' }, { en: 'jh', ml: 'ഝ' },
        { en: 'nj', ml: 'ഞ' }, { en: 'th', ml: 'ഥ' }, { en: 'dh', ml: 'ധ' },
        { en: 'ph', ml: 'ഫ' }, { en: 'bh', ml: 'ഭ' }, { en: 'sh', ml: 'ശ' },
        { en: 'Sh', ml: 'ഷ' }, { en: 'zh', ml: 'ഴ' }, { en: 'Rh', ml: 'ഴ' },
        { en: 'th', ml: 'ത' }, { en: 'dh', ml: 'ദ' }, { en: 'tt', ml: 'ട്ട' },
        { en: 'pp', ml: 'പ്പ' }, { en: 'kk', ml: 'ക്ക' }, { en: 'mm', ml: 'മ്മ' },
        { en: 'nn', ml: 'ന്ന' }, { en: 'll', ml: 'ല്ല' }, { en: 'yy', ml: 'യ്യ' },
        { en: 'rr', ml: 'റ്റ' }, { en: 'k', ml: 'ക' }, { en: 'g', ml: 'ഗ' },
        { en: 'c', ml: 'ച' }, { en: 'j', ml: 'ജ' }, { en: 't', ml: 'ത' },
        { en: 'd', ml: 'ദ' }, { en: 'T', ml: 'ട' }, { en: 'D', ml: 'ഡ' },
        { en: 'n', ml: 'ന' }, { en: 'N', ml: 'ണ' }, { en: 'p', ml: 'പ' },
        { en: 'f', ml: 'ഫ' }, { en: 'b', ml: 'ബ' }, { en: 'm', ml: 'മ' },
        { en: 'y', ml: 'യ' }, { en: 'r', ml: 'ര' }, { en: 'l', ml: 'ല' },
        { en: 'v', ml: 'വ' }, { en: 'w', ml: 'വ' }, { en: 's', ml: 'സ' },
        { en: 'h', ml: 'ഹ' }, { en: 'L', ml: 'ള' }, { en: 'R', ml: 'റ' },
        { en: 'x', ml: 'ക്ഷ' }
    ];

    const CHILLU = {
        'n': 'ൻ', 'r': 'ർ', 'l': 'ൽ', 'L': 'ൾ', 'N': 'ൺ', 'k': 'ൿ'
    };

    // Dictionary override for common names, stars & deities
    const DICTIONARY = {
        'aswathi': 'അശ്വതി', 'ashwathi': 'അശ്വതി',
        'rohani': 'രോഹിണി', 'rohini': 'രോഹിണി',
        'bharani': 'ഭരണി',
        'karthika': 'കാർത്തിക', 'kartika': 'കാർത്തിക',
        'makeeryam': 'മകീര്യം', 'makiryam': 'മകീര്യം',
        'thiruvathira': 'തിരുവാതിര',
        'punartham': 'പുണർതം',
        'pooyam': 'പൂയം',
        'aayilyam': 'ആയില്യം', 'ayilyam': 'ആയില്യം',
        'makam': 'മകം',
        'pooram': 'പൂരം',
        'uthram': 'ഉത്രം',
        'atham': 'അത്തം',
        'chithira': 'ചിത്തിര', 'chithra': 'ചിത്തിര',
        'chothi': 'ചോതി',
        'vishakham': 'വിശാഖം', 'visakham': 'വിശാഖം',
        'anizham': 'അനിഴം',
        'meenam': 'മീനം',
        'thrikketta': 'തൃക്കേട്ട',
        'moolam': 'മൂലം',
        'pooradam': 'പൂരാടം',
        'uthradam': 'ഉത്രാടം',
        'thiruvonam': 'തിരുവോണം',
        'avittom': 'അവിട്ടം', 'avittam': 'അവിട്ടം',
        'chathayam': 'ചതയം',
        'pooruruttathi': 'പൂരുരുട്ടാതി',
        'uthruttathi': 'ഉത്രട്ടാതി',
        'revathi': 'രേവതി',
        'ganapathy': 'ഗണപതി', 'ganapati': 'ഗണപതി',
        'shiva': 'ശിവൻ', 'sivan': 'ശിവൻ',
        'vishnu': 'വിഷ്ണു',
        'devi': 'ദേവി',
        'krishna': 'കൃഷ്ണൻ', 'krishnan': 'ശ്രീകൃഷ്ണൻ', 'sreekrishnan': 'ശ്രീകൃഷ്ണൻ',
        'subrahmanyan': 'സുബ്രഹ്മണ്യൻ', 'murugan': 'മുരുകൻ',
        'ayyappan': 'അയ്യപ്പൻ',
        'hanuman': 'ഹനുമാൻ',
        'bhagavathy': 'ഭഗവതി', 'bhagavathi': 'ഭഗവതി',
        'durgadevi': 'ദുർഗ്ഗാദേവി', 'durga': 'ദുർഗ്ഗാദേവി',
        'bhadrakali': 'ഭദ്രകാളി', 'kali': 'ഭദ്രകാളി',
        'saraswathi': 'സരസ്വതി', 'saraswati': 'സരസ്വതി',
        'lakshmi': 'ലക്ഷ്മി', 'laxmi': 'ലക്ഷ്മി',
        'narasimhamoorthy': 'നരസിംഹമൂർത്തി', 'narasimham': 'നരസിംഹമൂർത്തി',
        'nagarajavu': 'നാഗരാജാവ്', 'nagam': 'നാഗരാജാവ്',
        'shasthavu': 'ശാസ്താവ്', 'sasthavu': 'ശാസ്താവ്',
        'archana': 'അർച്ചന',
        'pushpanjali': 'പുഷ്പാഞ്ജലി',
        'payasam': 'പായസം',
        'vilakku': 'വിളക്ക്',
        'nivedyam': 'നിവേദ്യം',
        'ganapathyhomam': 'ഗണപതി ഹോമം',
        'homam': 'ഹോമം',
        'abhishekam': 'അഭിഷേകം',
        'saahasranamam': 'സഹസ്രനാമം', 'sahasranamam': 'സഹസ്രനാമം'
    };

    function offlineTransliterateWord(word) {
        if (!word) return '';
        const lower = word.toLowerCase();
        if (DICTIONARY[lower]) return DICTIONARY[lower];

        let result = '';
        let i = 0;
        const len = word.length;

        while (i < len) {
            let matched = false;

            // Check Vowel at start or after vowel break
            if (i === 0 || (result.length > 0 && isMalayalamVowel(result.slice(-1)))) {
                for (let vLen = 2; vLen >= 1; vLen--) {
                    const sub = word.substr(i, vLen);
                    if (VOWELS[sub]) {
                        result += VOWELS[sub];
                        i += vLen;
                        matched = true;
                        break;
                    }
                }
                if (matched) continue;
            }

            // Check Consonant
            for (const cObj of CONSONANTS) {
                const cEn = cObj.en;
                if (word.substr(i, cEn.length).toLowerCase() === cEn.toLowerCase()) {
                    result += cObj.ml;
                    i += cEn.length;

                    // Next check vowel matra or chandrakala
                    let matraMatched = false;
                    for (let vLen = 2; vLen >= 1; vLen--) {
                        const vSub = word.substr(i, vLen).toLowerCase();
                        if (VOWEL_MATRAS[vSub] !== undefined) {
                            result += VOWEL_MATRAS[vSub];
                            i += vLen;
                            matraMatched = true;
                            break;
                        }
                    }

                    if (!matraMatched) {
                        // If end of word or followed by consonant, add chandrakala / check chillu
                        if (i >= len) {
                            // Check if chillu letter applies
                            const cChar = cEn.toLowerCase();
                            if (CHILLU[cChar] && result.endsWith(cObj.ml)) {
                                result = result.slice(0, -cObj.ml.length) + CHILLU[cChar];
                            } else {
                                result += '്';
                            }
                        } else {
                            result += '്';
                        }
                    }
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                // Unknown character, append directly
                result += word[i];
                i++;
            }
        }

        return result;
    }

    function isMalayalamVowel(ch) {
        return /[അ-ഔ]/.test(ch);
    }

    // --- GOOGLE INPUT TOOLS API INTEGRATION ---
    const apiCache = {};

    async function fetchGoogleSuggestions(word) {
        if (!word || !/^[a-zA-Z]+$/.test(word)) return [word];
        const lower = word.toLowerCase();
        if (apiCache[lower]) return apiCache[lower];

        try {
            const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=ml-t-i0-und&num=5`;
            const resp = await fetch(url);
            const data = await resp.json();
            if (data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
                const suggestions = data[1][0][1];
                apiCache[lower] = suggestions;
                return suggestions;
            }
        } catch (e) {
            console.warn('Google Transliterate API offline, using fallback engine.', e);
        }

        // Fallback to offline engine
        const fallback = offlineTransliterateWord(word);
        const res = [fallback];
        if (DICTIONARY[lower]) res.unshift(DICTIONARY[lower]);
        return res;
    }

    // --- UI CONTROLLER & SUGGESTION POPUP ---
    let enabled = localStorage.getItem('manglish_enabled') !== 'false';
    let currentInput = null;
    let popupEl = null;
    let selectedIndex = 0;
    let currentSuggestions = [];
    let activeWordStart = 0;
    let activeWordEnd = 0;

    function createPopup() {
        if (popupEl) return;
        popupEl = document.createElement('div');
        popupEl.id = 'manglish-suggestion-popup';
        popupEl.className = 'manglish-popup';
        document.body.appendChild(popupEl);
    }

    function hidePopup() {
        if (popupEl) {
            popupEl.style.display = 'none';
            popupEl.innerHTML = '';
        }
        currentSuggestions = [];
        selectedIndex = 0;
    }

    function renderPopup(suggestions, rect) {
        createPopup();
        if (!suggestions || suggestions.length === 0) {
            hidePopup();
            return;
        }

        currentSuggestions = suggestions;
        popupEl.innerHTML = '';
        suggestions.forEach((sug, idx) => {
            const item = document.createElement('div');
            item.className = 'manglish-popup-item' + (idx === selectedIndex ? ' active' : '');
            item.innerHTML = `<span class="manglish-sug-num">${idx + 1}.</span> <span class="manglish-sug-text">${sug}</span>`;
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                applySuggestion(sug);
            });
            popupEl.appendChild(item);
        });

        // Position popup below input
        popupEl.style.left = `${rect.left + window.scrollX}px`;
        popupEl.style.top = `${rect.bottom + window.scrollY + 4}px`;
        popupEl.style.minWidth = `${Math.max(rect.width, 160)}px`;
        popupEl.style.display = 'block';
    }

    function applySuggestion(sug) {
        if (!currentInput) return;
        const val = currentInput.value;
        const before = val.substring(0, activeWordStart);
        const after = val.substring(activeWordEnd);

        // Replace word with Malayalam suggestion
        currentInput.value = before + sug + after;
        const newCursor = activeWordStart + sug.length;
        currentInput.setSelectionRange(newCursor, newCursor);
        currentInput.dispatchEvent(new Event('input', { bubbles: true }));

        hidePopup();
    }

    function getCurrentWordInfo(input) {
        const val = input.value;
        const cursorPos = input.selectionStart;

        let start = cursorPos;
        while (start > 0 && /[a-zA-Z]/.test(val[start - 1])) {
            start--;
        }

        let end = cursorPos;
        while (end < val.length && /[a-zA-Z]/.test(val[end])) {
            end++;
        }

        const word = val.substring(start, cursorPos); // take word up to cursor
        return { word, start, end, fullWord: val.substring(start, end) };
    }

    async function handleInputKey(e) {
        if (!enabled) return;
        const input = e.target;
        currentInput = input;

        const info = getCurrentWordInfo(input);
        activeWordStart = info.start;
        activeWordEnd = info.end;

        // If Popup is visible and key is navigation key
        if (popupEl && popupEl.style.display === 'block' && currentSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % currentSuggestions.length;
                updatePopupSelection();
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
                updatePopupSelection();
                return;
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                applySuggestion(currentSuggestions[selectedIndex]);
                return;
            } else if (e.key === 'Escape') {
                hidePopup();
                return;
            }
        }

        // On Spacebar press, auto-convert if suggestion exists
        if (e.key === ' ' && info.word) {
            const suggestions = await fetchGoogleSuggestions(info.word);
            if (suggestions && suggestions.length > 0) {
                applySuggestion(suggestions[0]);
            }
        }
    }

    async function handleInputEvent(e) {
        if (!enabled) {
            hidePopup();
            return;
        }
        const input = e.target;
        currentInput = input;

        const info = getCurrentWordInfo(input);
        activeWordStart = info.start;
        activeWordEnd = info.end;

        if (info.word && info.word.length >= 1) {
            const rect = input.getBoundingClientRect();
            const suggestions = await fetchGoogleSuggestions(info.word);
            if (currentInput === input && info.word === getCurrentWordInfo(input).word) {
                renderPopup(suggestions, rect);
            }
        } else {
            hidePopup();
        }
    }

    function updatePopupSelection() {
        if (!popupEl) return;
        const items = popupEl.querySelectorAll('.manglish-popup-item');
        items.forEach((item, idx) => {
            if (idx === selectedIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function bindToInput(input) {
        if (!input || input.dataset.manglishBound) return;
        input.dataset.manglishBound = "true";

        input.addEventListener('keydown', handleInputKey);
        input.addEventListener('input', handleInputEvent);
        input.addEventListener('blur', () => {
            setTimeout(hidePopup, 200);
        });
    }

    function bindAllInputs() {
        const selectors = [
            '#deity', '#pooja', '.item-name', '.item-star', '[data-manglish="true"]'
        ];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(bindToInput);
        });
    }

    function initUI() {
        // Create Toggle Controls in global section
        const globalSec = document.querySelector('.global-section');
        const formSection = document.querySelector('.form-section');

        const bar = document.createElement('div');
        bar.className = 'manglish-control-bar';
        bar.innerHTML = `
            <div class="manglish-toggle-wrapper">
                <label class="manglish-switch">
                    <input type="checkbox" id="manglishToggle" ${enabled ? 'checked' : ''}>
                    <span class="manglish-slider"></span>
                </label>
                <span class="manglish-label">
                    <strong>Manglish Typing</strong> (English → മലയാളം)
                </span>
            </div>
            <span class="manglish-status ${enabled ? 'active' : ''}" id="manglishStatusBadge">
                ${enabled ? 'മലയാളം Active' : 'English Mode'}
            </span>
        `;

        if (formSection && globalSec) {
            formSection.insertBefore(bar, globalSec);
        } else if (formSection) {
            formSection.prepend(bar);
        }

        const toggleBtn = document.getElementById('manglishToggle');
        const badge = document.getElementById('manglishStatusBadge');

        if (toggleBtn) {
            toggleBtn.addEventListener('change', (e) => {
                enabled = e.target.checked;
                localStorage.setItem('manglish_enabled', enabled);
                if (badge) {
                    badge.innerText = enabled ? 'മലയാളം Active' : 'English Mode';
                    badge.className = 'manglish-status ' + (enabled ? 'active' : '');
                }
                if (!enabled) hidePopup();
            });
        }

        // Bind existing inputs
        bindAllInputs();

        // MutationObserver to auto-bind dynamically added rows
        const container = document.getElementById('lineItemsContainer');
        if (container) {
            const observer = new MutationObserver(() => {
                bindAllInputs();
            });
            observer.observe(container, { childList: true, subtree: true });
        }
    }

    // Expose Global API
    window.ManglishEngine = {
        transliterate: offlineTransliterateWord,
        getSuggestions: fetchGoogleSuggestions,
        bindInput: bindToInput,
        bindAll: bindAllInputs,
        isEnabled: () => enabled,
        setEnabled: (val) => {
            enabled = val;
            const toggleBtn = document.getElementById('manglishToggle');
            if (toggleBtn) toggleBtn.checked = val;
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
})();
