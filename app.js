/* ═══════════════════════════════════════════════════════
   DAILY MANNA — app.js
   "God's Word · Our Daily Bread"
   Live Bible data from godlytalias/Bible-Database (XML)
   ═══════════════════════════════════════════════════════ */

/* ── Raw XML URLs (GitHub CDN via jsDelivr so CORS works) ── */
const BIBLE_XML_EN = 'https://cdn.jsdelivr.net/gh/godlytalias/Bible-Database@master/English/bible.xml';
const BIBLE_XML_TE = 'https://cdn.jsdelivr.net/gh/godlytalias/Bible-Database@master/Telugu/bible.xml';

/* ── Parsed Bible data (populated on load) ── */
let bibleDataEN = null;   // DOM Document
let bibleDataTE = null;   // DOM Document
let bibleLoadError = { en: false, te: false };

/* ────────────────────────────────────────────
   BOOK NAMES  (index 0-based = Book id in XML)
   ──────────────────────────────────────────── */
const BOOK_NAMES_EN = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy',
  'Joshua','Judges','Ruth','1 Samuel','2 Samuel',
  '1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra',
  'Nehemiah','Esther','Job','Psalms','Proverbs',
  'Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations',
  'Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk',
  'Zephaniah','Haggai','Zechariah','Malachi',
  'Matthew','Mark','Luke','John','Acts',
  'Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians',
  'Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy',
  '2 Timothy','Titus','Philemon','Hebrews','James',
  '1 Peter','2 Peter','1 John','2 John','3 John',
  'Jude','Revelation'
];

const BOOK_NAMES_TE = [
  'ఆదికాండము','నిర్గమకాండము','లేవీయకాండము','సంఖ్యాకాండము','ద్వితీయోపదేశకాండము',
  'యెహోషువ','న్యాయాధిపతులు','రూతు','1 సమూయేలు','2 సమూయేలు',
  '1 రాజులు','2 రాజులు','1 దినవృత్తాంతములు','2 దినవృత్తాంతములు','ఎజ్రా',
  'నెహెమ్యా','ఎస్తేరు','యోబు','కీర్తనలు','సామెతలు',
  'ప్రసంగి','పరమగీతము','యెషయా','యిర్మీయా','విలాపవాక్యములు',
  'యెహెజ్కేలు','దానియేలు','హోషేయ','యోవేలు','ఆమోసు',
  'ఓబద్యా','యోనా','మీకా','నహూము','హబక్కూకు',
  'జెఫన్యా','హగ్గయి','జెకర్యా','మలాకీ',
  'మత్తయి','మార్కు','లూకా','యోహాను','అపొస్తలుల కార్యములు',
  'రోమీయులకు','1 కొరింథీయులకు','2 కొరింథీయులకు','గలతీయులకు','ఎఫెసీయులకు',
  'ఫిలిప్పీయులకు','కొలొస్సయులకు','1 థెస్సలొనీకయులకు','2 థెస్సలొనీకయులకు','1 తిమోతికి',
  '2 తిమోతికి','తీతుకు','ఫిలేమోనుకు','హెబ్రీయులకు','యాకోబు',
  '1 పేతురు','2 పేతురు','1 యోహాను','2 యోహాను','3 యోహాను',
  'యూదా','ప్రకటన గ్రంథం'
];

/* Chapter counts per book (index = book 0-based) */
const CHAPTER_COUNTS = [
  50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,
  12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,
  28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22
];

/* Book categories for display grouping */
const BOOK_CATS = [
  'Pentateuch','Pentateuch','Pentateuch','Pentateuch','Pentateuch',
  'Historical','Historical','Historical','Historical','Historical',
  'Historical','Historical','Historical','Historical','Historical',
  'Historical','Historical','Poetry','Poetry','Poetry',
  'Poetry','Poetry','Major Prophets','Major Prophets','Major Prophets',
  'Major Prophets','Major Prophets','Minor Prophets','Minor Prophets','Minor Prophets',
  'Minor Prophets','Minor Prophets','Minor Prophets','Minor Prophets','Minor Prophets',
  'Minor Prophets','Minor Prophets','Minor Prophets','Minor Prophets',
  'Gospels','Gospels','Gospels','Gospels','History',
  'Epistles','Epistles','Epistles','Epistles','Epistles',
  'Epistles','Epistles','Epistles','Epistles','Epistles',
  'Epistles','Epistles','Epistles','Epistles','General Epistles',
  'General Epistles','General Epistles','General Epistles','General Epistles','General Epistles',
  'General Epistles','Prophecy'
];

/* ────────────────────────────────────────────
   JOURNEY READING PLAN (Day 1 → Day 45)
   ──────────────────────────────────────────── */
const PLAN = [
  { day:1,  testament:'Old Testament', bookIdx:0,  chapter:1,  title:'In the Beginning',         ref:'Gen 1'     },
  { day:2,  testament:'Old Testament', bookIdx:0,  chapter:2,  title:'The Garden of Eden',       ref:'Gen 2'     },
  { day:3,  testament:'Old Testament', bookIdx:0,  chapter:3,  title:'The Fall of Man',          ref:'Gen 3'     },
  { day:4,  testament:'Old Testament', bookIdx:0,  chapter:4,  title:'Cain and Abel',            ref:'Gen 4'     },
  { day:5,  testament:'Old Testament', bookIdx:0,  chapter:6,  title:'Noah and the Ark',         ref:'Gen 6'     },
  { day:6,  testament:'Old Testament', bookIdx:0,  chapter:7,  title:'The Great Flood',          ref:'Gen 7'     },
  { day:7,  testament:'Old Testament', bookIdx:0,  chapter:8,  title:'The Waters Recede',        ref:'Gen 8'     },
  { day:8,  testament:'Old Testament', bookIdx:0,  chapter:9,  title:"God's Covenant with Noah", ref:'Gen 9'     },
  { day:9,  testament:'Old Testament', bookIdx:0,  chapter:12, title:'The Call of Abram',        ref:'Gen 12'    },
  { day:10, testament:'Old Testament', bookIdx:0,  chapter:15, title:"God's Covenant",           ref:'Gen 15'    },
  { day:11, testament:'Old Testament', bookIdx:0,  chapter:22, title:'Abraham and Isaac',        ref:'Gen 22'    },
  { day:12, testament:'Old Testament', bookIdx:1,  chapter:3,  title:'The Burning Bush',         ref:'Exod 3'    },
  { day:13, testament:'Old Testament', bookIdx:1,  chapter:14, title:'Crossing the Red Sea',     ref:'Exod 14'   },
  { day:14, testament:'Old Testament', bookIdx:1,  chapter:20, title:'The Ten Commandments',     ref:'Exod 20'   },
  { day:15, testament:'Old Testament', bookIdx:18, chapter:1,  title:'The Blessed Man',          ref:'Ps 1'      },
  { day:16, testament:'Old Testament', bookIdx:18, chapter:23, title:'The Lord is My Shepherd',  ref:'Ps 23'     },
  { day:17, testament:'Old Testament', bookIdx:18, chapter:51, title:'A Prayer of Repentance',   ref:'Ps 51'     },
  { day:18, testament:'Old Testament', bookIdx:18, chapter:91, title:"God's Protection",         ref:'Ps 91'     },
  { day:19, testament:'Old Testament', bookIdx:19, chapter:1,  title:'The Beginning of Wisdom',  ref:'Prov 1'    },
  { day:20, testament:'Old Testament', bookIdx:19, chapter:3,  title:'Trust in the Lord',        ref:'Prov 3'    },
  { day:21, testament:'Old Testament', bookIdx:22, chapter:40, title:"Comfort for God's People", ref:'Isa 40'    },
  { day:22, testament:'Old Testament', bookIdx:22, chapter:53, title:'The Suffering Servant',    ref:'Isa 53'    },
  { day:23, testament:'Old Testament', bookIdx:26, chapter:3,  title:'The Fiery Furnace',        ref:'Dan 3'     },
  { day:24, testament:'Old Testament', bookIdx:31, chapter:1,  title:'Jonah Flees from God',     ref:'Jon 1'     },
  { day:25, testament:'New Testament', bookIdx:39, chapter:1,  title:'The Genealogy of Jesus',   ref:'Matt 1'    },
  { day:26, testament:'New Testament', bookIdx:39, chapter:5,  title:'The Sermon on the Mount',  ref:'Matt 5'    },
  { day:27, testament:'New Testament', bookIdx:39, chapter:6,  title:"The Lord's Prayer",        ref:'Matt 6'    },
  { day:28, testament:'New Testament', bookIdx:41, chapter:2,  title:'The Birth of Jesus',       ref:'Luke 2'    },
  { day:29, testament:'New Testament', bookIdx:42, chapter:1,  title:'The Word Became Flesh',    ref:'John 1'    },
  { day:30, testament:'New Testament', bookIdx:42, chapter:3,  title:'Born Again',               ref:'John 3'    },
  { day:31, testament:'New Testament', bookIdx:42, chapter:14, title:'I Am the Way',             ref:'John 14'   },
  { day:32, testament:'New Testament', bookIdx:42, chapter:15, title:'The True Vine',            ref:'John 15'   },
  { day:33, testament:'New Testament', bookIdx:43, chapter:1,  title:'The Ascension',            ref:'Acts 1'    },
  { day:34, testament:'New Testament', bookIdx:43, chapter:2,  title:'The Day of Pentecost',     ref:'Acts 2'    },
  { day:35, testament:'New Testament', bookIdx:44, chapter:3,  title:'Righteousness by Faith',   ref:'Rom 3'     },
  { day:36, testament:'New Testament', bookIdx:44, chapter:8,  title:'Life in the Spirit',       ref:'Rom 8'     },
  { day:37, testament:'New Testament', bookIdx:44, chapter:12, title:'A Living Sacrifice',       ref:'Rom 12'    },
  { day:38, testament:'New Testament', bookIdx:45, chapter:13, title:'The Love Chapter',         ref:'1 Cor 13'  },
  { day:39, testament:'New Testament', bookIdx:47, chapter:5,  title:'Fruit of the Spirit',      ref:'Gal 5'     },
  { day:40, testament:'New Testament', bookIdx:48, chapter:6,  title:'Armor of God',             ref:'Eph 6'     },
  { day:41, testament:'New Testament', bookIdx:49, chapter:4,  title:'Rejoice Always',           ref:'Phil 4'    },
  { day:42, testament:'New Testament', bookIdx:57, chapter:11, title:'Faith Hall of Fame',       ref:'Heb 11'    },
  { day:43, testament:'New Testament', bookIdx:58, chapter:1,  title:'Trials and Temptations',   ref:'Jas 1'     },
  { day:44, testament:'New Testament', bookIdx:65, chapter:1,  title:'The Revelation of Jesus',  ref:'Rev 1'     },
  { day:45, testament:'New Testament', bookIdx:65, chapter:21, title:'The New Jerusalem',        ref:'Rev 21'    },
];
// Add derived fields
PLAN.forEach(p => {
  p.book    = BOOK_NAMES_EN[p.bookIdx];
  p.bookTE  = BOOK_NAMES_TE[p.bookIdx];
  p.verses  = 20; // fallback; real count comes from XML
});

/* ────────────────────────────────────────────
   VERSES OF THE DAY
   ──────────────────────────────────────────── */
const VERSES_OF_DAY = [
  { en:'"Your word is a lamp to my feet and a light to my path."',       te:'"నీ వాక్యము నా పాదములకు దీపమును నా మార్గమునకు వెలుగునై యున్నది."', ref:'Psalm 119:105' },
  { en:'"For God so loved the world that he gave his one and only Son."', te:'"దేవుడు లోకమును అంతగా ప్రేమించెను గనుక ఆయన తన అద్వితీయకుమారుని అనుగ్రహించెను."', ref:'John 3:16' },
  { en:'"I can do all this through him who gives me strength."',          te:'"నన్ను బలపరచువాని ద్వారా నేను సమస్తమును చేయగలను."', ref:'Philippians 4:13' },
  { en:'"Trust in the Lord with all your heart."',                        te:'"నీ పూర్ణ హృదయముతో యెహోవాను నమ్ముకొనుము."', ref:'Proverbs 3:5' },
  { en:'"Be still, and know that I am God."',                             te:'"నిమ్మళంగా ఉండుడి, నేను దేవుడనని తెలిసికొనుడి."', ref:'Psalm 46:10' },
  { en:'"The Lord is my shepherd, I lack nothing."',                      te:'"యెహోవా నా కాపరి, నాకు కొదువ కలుగదు."', ref:'Psalm 23:1' },
  { en:'"Ask and it will be given to you."',                              te:'"అడుగుడి అప్పుడు మీకు ఇయ్యబడును."', ref:'Matthew 7:7' },
];

/* ────────────────────────────────────────────
   QUIZ BANK
   ──────────────────────────────────────────── */
const QUIZ_BANK = {
  1:[{q:'How many days did God take to complete creation?',opts:['5 days','6 days','7 days','10 days'],ans:1},{q:'What did God create on the first day?',opts:['Sun and Moon','Light','Animals','Man'],ans:1},{q:'What did God say about everything he made?',opts:['It was good','It was perfect','It was finished','It was holy'],ans:0}],
  2:[{q:'From what was the man formed?',opts:['Water','Clay','Dust of the ground','Stone'],ans:2},{q:'What was the name of the garden?',opts:['Paradise','Eden','Canaan','Zion'],ans:1},{q:"What was the man's first task?",opts:['Building a city','Naming the animals','Planting trees','Praying'],ans:1}],
  3:[{q:'Who tempted Eve?',opts:['An angel','The serpent','A stranger','Adam'],ans:1},{q:'What did God make for Adam and Eve after the fall?',opts:['Cloth robes','Garments of skin','Gold rings','Tents'],ans:1},{q:'What fruit was forbidden?',opts:['Apple of Life','Tree of the Sea','Tree of Knowledge','Tree of Light'],ans:2}],
  12:[{q:'What appeared to Moses?',opts:['A rainbow','A burning bush',"An angel's wings",'A pillar of fire'],ans:1},{q:'What was Moses asked to remove?',opts:['His cloak','His sandals','His staff','His hat'],ans:1},{q:'Who did God say he was to Moses?',opts:['The Creator','The King','The God of Abraham Isaac and Jacob','The Lord of Hosts'],ans:2}],
  15:[{q:'Who is described as blessed in Psalm 1?',opts:['The warrior','The rich man',"One who meditates on God's law",'The prophet'],ans:2},{q:'To what is the righteous man compared?',opts:['A cedar tree','A tree planted by streams of water','A mountain','A great river'],ans:1},{q:'What happens to the chaff?',opts:['It grows stronger','It is watered','The wind drives it away','It stays'],ans:2}],
  16:[{q:'Who is the shepherd in Psalm 23?',opts:['David','Moses','The Lord','An Angel'],ans:2},{q:'The Lord makes the psalmist lie down in?',opts:['Rocky places','Green pastures','Still waters','His temple'],ans:1},{q:'What follows the psalmist all his days?',opts:['Peace and joy','Goodness and mercy','Grace and truth','Love and kindness'],ans:1}],
  26:[{q:'Who will inherit the earth according to Jesus?',opts:['Peacemakers','Poor in spirit','The meek','Those who mourn'],ans:2},{q:'Jesus says his followers are the _____ of the earth.',opts:['Light','Salt','Rock','Bread'],ans:1},{q:'What should NOT be done with a lamp?',opts:['Put it on a stand','Put it under a bowl','Light it at night','Carry it'],ans:1}],
  29:[{q:'In the beginning was the _____ (John 1).',opts:['Light','Spirit','Word','Lamb'],ans:2},{q:'Through whom did grace and truth come?',opts:['Moses','Abraham','The prophets','Jesus Christ'],ans:3},{q:'John the Baptist said he was not worthy to do what?',opts:['Baptize Jesus','Untie his sandals','Preach to crowds','Follow Jesus'],ans:1}],
  30:[{q:'Who came to Jesus by night?',opts:['A tax collector','Nicodemus','A Pharisee named Simon','Mary Magdalene'],ans:1},{q:'What must one do to be born again?',opts:['Be baptized in water','Be born of water and Spirit','Follow all commandments','Fast 40 days'],ans:1},{q:'For God so loved the world he gave his?',opts:['His angels','The Holy Spirit','His one and only Son','The scriptures'],ans:2}],
  38:[{q:'Love is patient, love is ___.',opts:['Strong','Kind','Bold','Brave'],ans:1},{q:'What does love never do?',opts:['It never prays','It never fails','It never speaks','It never acts'],ans:1},{q:'What are the greatest three things?',opts:['Faith hope and love','Prayer fasting giving','Wisdom knowledge power','Truth grace mercy'],ans:0}],
};
const DEFAULT_QUIZ = [
  {q:'What is the main theme of this chapter?',opts:["God's love and grace",'Human disobedience','Prayer and worship','Prophecy'],ans:0},
  {q:'Who is the central figure in this passage?',opts:['A prophet of God','An angel','Jesus or a patriarch','A king of Israel'],ans:2},
  {q:'What can we apply from this chapter today?',opts:['Trust in God always','Avoid reading scripture','Rely only on ourselves','Keep faith secret'],ans:0},
];

/* ────────────────────────────────────────────
   LEVEL SYSTEM
   ──────────────────────────────────────────── */
const LEVELS=[{name:'Seeker',min:0},{name:'Disciple',min:200},{name:'Scribe',min:500},{name:'Prophet',min:1000},{name:'Apostle',min:2000},{name:'Elder',min:4000}];
function getLevel(xp){let lv=0;for(let i=0;i<LEVELS.length;i++)if(xp>=LEVELS[i].min)lv=i;return{idx:lv,...LEVELS[lv]};}
function nextLevelXP(xp){const lv=getLevel(xp);return lv.idx<LEVELS.length-1?LEVELS[lv.idx+1].min:lv.min+9999;}

/* ────────────────────────────────────────────
   APP STATE
   ──────────────────────────────────────────── */
let currentLang        = null;
let dailyGoal          = 1;
let pendingLang        = null;
let pendingGoal        = null;
let completedDays      = {};
let streak             = 0;
let totalXP            = 0;
let activeDayNum       = null;

/* Calendar-based streak record. currentStreak mirrors into the legacy
   `streak` variable above so existing render code keeps working untouched. */
let streakData = {
  currentStreak:    0,
  longestStreak:    0,
  lastCompletedDate: null,
  completedDates:    []
};

/* Has onboarding (language + goal) ever been completed on this device? */
let hasOnboarded = false;

const STORAGE_KEY = 'scriptureJourneyState_v1';
let timerSec           = 0;
let timerRunning       = false;
let timerInterval      = null;
let curQ=0,score=0,answered=false,activeQuiz=[];
let readingDisplayLang = 'en';

// Bible browser state
let bibleTab    = 'ot';
let bibleLang   = 'en';
let bibleSearch = '';
let bfrBookIdx  = 0;
let bfrChapter  = 1;
let bfrLang     = 'en';
let bfrFontSz   = 16;

const LANG_LABELS    = {en:'🇬🇧 EN', te:'🇮🇳 TE', both:'🌐 EN·TE'};
const LANG_TAG_SHORT = {en:'EN', te:'TE', both:'EN·TE'};

/* ════════════════════════════════════════════
   PERSISTENCE  (localStorage)
   ════════════════════════════════════════════ */

/** Save the app's persistable state to localStorage. */
function saveState() {
  try {
    const payload = {
      version:      1,
      hasOnboarded,
      currentLang,
      dailyGoal,
      completedDays,
      totalXP,
      streakData
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Unable to save app state to localStorage:', e.message);
  }
}

/** Load previously saved state. Returns null if nothing valid is stored. */
function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch (e) {
    console.warn('Unable to read saved app state (it may be corrupted):', e.message);
    return null;
  }
}

/** Apply a previously saved state object onto the live app variables. */
function applySavedState(data) {
  hasOnboarded   = !!data.hasOnboarded;
  currentLang    = data.currentLang || null;
  dailyGoal      = data.dailyGoal || 1;
  completedDays  = data.completedDays || {};
  totalXP        = data.totalXP || 0;
  if (data.streakData && typeof data.streakData === 'object') {
    streakData = Object.assign(
      { currentStreak:0, longestStreak:0, lastCompletedDate:null, completedDates:[] },
      data.streakData
    );
  }
  streak = streakData.currentStreak;
}

/* ════════════════════════════════════════════
   DAY / NIGHT THEME
   Stored separately from the main app state so the
   existing STORAGE_KEY payload/shape is untouched.
   ════════════════════════════════════════════ */
const THEME_KEY = 'dailyMannaTheme_v1';

function applyTheme(mode) {
  document.body.setAttribute('data-theme', mode === 'dark' ? 'dark' : 'light');
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.classList.toggle('theme-active', btn.dataset.theme === mode);
  });
}
function setTheme(mode) {
  try { localStorage.setItem(THEME_KEY, mode); } catch (e) {}
  applyTheme(mode);
}
function loadTheme() {
  let mode = 'light';
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') mode = saved;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) mode = 'dark';
  } catch (e) {}
  applyTheme(mode);
}

/* ────────────────────────────────────────────
   CALENDAR DATE HELPERS
   Uses the device's local calendar date (not raw timestamps), so a
   streak never flips because of timezone/UTC conversion quirks.
   ──────────────────────────────────────────── */

/** Returns today's local date as 'YYYY-MM-DD'. */
function getTodayDateKey() {
  return dateToKey(new Date());
}

/** Returns the local date `offsetDays` from today as 'YYYY-MM-DD'. */
function getOffsetDateKey(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return dateToKey(d);
}

function dateToKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Deterministic, stable index for a 'YYYY-MM-DD' key into a list of length `mod`.
 * Based on the UTC day-number of that calendar date — not random, not tied
 * to how many readings the user has completed.
 */
function stableIndexFromDate(dateKey, mod) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utcDays = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return ((utcDays % mod) + mod) % mod;
}

/* ════════════════════════════════════════════
   STREAK SYSTEM  (calendar-based)
   ════════════════════════════════════════════ */

/**
 * Call after the user completes their required daily reading/quiz.
 * Same-day completions are idempotent (no double increment). Consecutive
 * calendar days increment the streak; a missed day resets it to 1.
 */
function updateStreak() {
  const today = getTodayDateKey();
  if (streakData.lastCompletedDate === today) {
    // Already completed today — do not increase the streak again.
    streak = streakData.currentStreak;
    return;
  }
  const yesterday = getOffsetDateKey(-1);
  streakData.currentStreak = (streakData.lastCompletedDate === yesterday)
    ? streakData.currentStreak + 1
    : 1;
  streakData.lastCompletedDate = today;
  if (!streakData.completedDates.includes(today)) {
    streakData.completedDates.push(today);
  }
  streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);
  streak = streakData.currentStreak;
}

/**
 * On app load, if the user missed a calendar day since their last
 * completion, the displayed streak should reflect that break even
 * before they complete a new reading. Longest streak is never reduced.
 */
function recomputeStreakOnLoad() {
  const today     = getTodayDateKey();
  const yesterday = getOffsetDateKey(-1);
  if (streakData.lastCompletedDate &&
      streakData.lastCompletedDate !== today &&
      streakData.lastCompletedDate !== yesterday) {
    streakData.currentStreak = 0;
  }
  streak = streakData.currentStreak;
}

/* ════════════════════════════════════════════
   VERSE OF THE DAY  (date-based, not completion-count-based)
   ════════════════════════════════════════════ */

/**
 * Returns today's Verse of the Day. Deterministic from the calendar date,
 * so it stays the same across reloads within a day and changes only when
 * the date changes. English and Telugu always share the same reference
 * because VERSES_OF_DAY stores both languages under one shared entry.
 */
function getVerseOfTheDay() {
  const idx = stableIndexFromDate(getTodayDateKey(), VERSES_OF_DAY.length);
  return VERSES_OF_DAY[idx];
}

/* ════════════════════════════════════════════
   XML LOADER
   ════════════════════════════════════════════ */

/**
 * Fetch and parse a bible.xml file.
 * Returns a DOM Document or null on failure.
 */
async function fetchBibleXML(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const parser = new DOMParser();
    return parser.parseFromString(text, 'text/xml');
  } catch(e) {
    console.warn('Bible XML load failed:', url, e.message);
    return null;
  }
}

/**
 * Get all verses for a book+chapter from a parsed DOM Document.
 * Book id is 0-based, Chapter is 1-based (matching XML structure).
 * Returns array of verse text strings.
 */
function getVerses(doc, bookId, chapter) {
  if (!doc) return [];
  // XML structure: <Book id="0"><Chapter id="1"><Verse id="1">text</Verse></Chapter></Book>
  const bookEl = doc.querySelector(`Book[id="${bookId}"]`);
  if (!bookEl) return [];
  const chapterEl = bookEl.querySelector(`Chapter[id="${chapter}"]`);
  if (!chapterEl) return [];
  return Array.from(chapterEl.querySelectorAll('Verse')).map(v => v.textContent.trim());
}

/**
 * Get chapter count for a book from XML.
 */
function getChapterCount(doc, bookId) {
  if (!doc) return CHAPTER_COUNTS[bookId] || 0;
  const bookEl = doc.querySelector(`Book[id="${bookId}"]`);
  if (!bookEl) return CHAPTER_COUNTS[bookId] || 0;
  return bookEl.querySelectorAll('Chapter').length;
}

/**
 * Validate that a parsed Bible XML Document actually contains a full,
 * usable Bible: the expected 66 books, chapters within each book, and
 * verses within a sampled chapter. A `fetch()` that "succeeds" with a
 * malformed or truncated document should NOT be treated as a valid load.
 *
 * Returns { valid, bookCount, message }.
 */
function validateBibleData(doc, label) {
  if (!doc) {
    return { valid: false, bookCount: 0, message: `${label}: no document (fetch or parse failed).` };
  }
  // A failed DOMParser call produces a document with a <parsererror> node.
  if (doc.querySelector('parsererror')) {
    return { valid: false, bookCount: 0, message: `${label}: XML failed to parse.` };
  }
  const books = doc.querySelectorAll('Book');
  const bookCount = books.length;
  if (bookCount !== 66) {
    return { valid: false, bookCount, message: `${label}: expected 66 books, found ${bookCount}.` };
  }
  // Spot-check a known reference (Genesis, book id 0) for chapters + verses.
  const sampleChapters = getChapterCount(doc, 0);
  const sampleVerses   = getVerses(doc, 0, 1).length;
  if (sampleChapters < CHAPTER_COUNTS[0] || sampleVerses === 0) {
    return {
      valid: false, bookCount,
      message: `${label}: Genesis has ${sampleChapters} chapters / ${sampleVerses} verses in chapter 1 — data looks incomplete.`
    };
  }
  return { valid: true, bookCount, message: `${label}: OK — ${bookCount} books, Genesis 1 has ${sampleVerses} verses.` };
}

/**
 * Render verse array as styled HTML passage.
 * Each verse gets its own line with the verse number as a superscript badge.
 */
function versesToHTML(verses, bookName, chapter, lang) {
  if (!verses || verses.length === 0) {
    const isTe = lang === 'te';
    return `
      <div class="passage-title" style="${isTe?"font-family:'Noto Serif Telugu',serif":''}">${bookName} ${chapter}</div>
      <div class="passage-sub">${isTe?'తెలుగు బైబిల్':'New International Version'}</div>
      <div class="passage-text" style="text-align:center;padding:48px 0;color:var(--ink-light)">
        <div style="font-size:44px;margin-bottom:16px">✟</div>
        <div style="font-family:'Lora',serif;font-style:italic;font-size:14px;color:var(--ink-mid)">
          ${isTe?`${bookName} అధ్యాయం ${chapter} లోడ్ అవుతోంది...`:`Loading ${bookName} chapter ${chapter}…`}
        </div>
      </div>`;
  }
  const isTe   = lang === 'te';
  const subVer = isTe ? 'తెలుగు బైబిల్' : 'King James Version';
  const titleFont  = isTe ? `font-family:'Noto Serif Telugu',serif` : '';
  const verseFont  = isTe
    ? `font-family:'Noto Serif Telugu',serif;font-size:15px;line-height:2`
    : `font-family:'Lora',serif;font-size:16px;line-height:1.75`;

  /* Each verse is its own <div> row — number pill + text side by side.
     data-verse-idx (0-based) lets the Read Aloud module target/highlight
     a specific row without needing to parse verse numbers back out. */
  const versesHTML = verses.map((v, i) => {
    const num  = i + 1;
    const text = escapeHtml(v);
    return `
      <div class="verse-row" data-verse-idx="${i}">
        <span class="verse-num-pill">${num}</span>
        <span class="verse-body">${text}</span>
      </div>`;
  }).join('');

  return `
    <div class="passage-title" style="${titleFont}">${bookName} ${chapter}</div>
    <div class="passage-sub">${bookName} ${chapter} · ${subVer} · ${verses.length} verses</div>
    <div class="passage-text" style="${verseFont}">${versesHTML}</div>`;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/** Error block shown in place of a passage when its Bible dataset failed to load. */
function bibleErrorHTML(lang) {
  const isTe = lang === 'te';
  const msg  = isTe
    ? 'తెలుగు బైబిల్ డేటా లోడ్ కాలేదు. దయచేసి మీ ఇంటర్నెట్ కనెక్షన్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.'
    : 'This Bible text could not be loaded. Please check your connection and try again.';
  return `
    <div style="text-align:center;padding:48px 20px;color:var(--ink-light)">
      <div style="font-size:36px;margin-bottom:14px">😕</div>
      <div style="font-family:'Lora',serif;font-size:14px;color:var(--ink-mid);margin-bottom:16px;line-height:1.6">${msg}</div>
      <button onclick="retryBibleLoad()" style="padding:10px 22px;border-radius:20px;border:none;background:var(--emerald);color:white;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer">↻ ${isTe ? 'మళ్లీ ప్రయత్నించండి' : 'Retry'}</button>
    </div>`;
}

/** Re-fetches/validates Bible data mid-session and re-renders whatever passage is on screen. */
async function retryBibleLoad() {
  await loadBibleData();
  // Re-render whichever reading view is currently active, if any.
  if (document.getElementById('screen-reading').classList.contains('active') && activeDayNum) {
    const plan = PLAN.find(p => p.day === activeDayNum);
    if (plan) renderPassage(plan);
  }
  if (document.getElementById('bible-read-view').style.display === 'flex') {
    renderBfrBody();
  }
}

/* ════════════════════════════════════════════
   STARTUP — load + validate XML files
   ════════════════════════════════════════════ */

/**
 * Fetches and validates both Bible datasets. Reports progress via
 * `onStatus(text)` so the splash screen can show it. Never silently
 * "succeeds" on a failed or malformed load — always returns whether
 * each language is actually usable.
 *
 * Returns { enOk, teOk, enMessage, teMessage }.
 */
async function loadBibleData(onStatus) {
  const report = (t) => { if (typeof onStatus === 'function') onStatus(t); };

  report('Loading English Bible…');
  report('Loading Telugu Bible…');
  const [en, te] = await Promise.all([
    fetchBibleXML(BIBLE_XML_EN),
    fetchBibleXML(BIBLE_XML_TE)
  ]);
  bibleDataEN = en;
  bibleDataTE = te;

  report('Validating Bible data…');
  const enCheck = validateBibleData(en, 'English Bible');
  const teCheck = validateBibleData(te, 'Telugu Bible');

  bibleLoadError.en = !enCheck.valid;
  bibleLoadError.te = !teCheck.valid;

  // Log details to the console for debugging — never shown to the user directly.
  console.log(enCheck.message);
  console.log(teCheck.message);
  if (!enCheck.valid) console.warn('English Bible failed validation:', enCheck.message);
  if (!teCheck.valid) console.warn('Telugu Bible failed validation:', teCheck.message);

  return { enOk: enCheck.valid, teOk: teCheck.valid, enMessage: enCheck.message, teMessage: teCheck.message };
}

/* ════════════════════════════════════════════
   ONBOARDING
   ════════════════════════════════════════════ */
function selectLang(l) {
  pendingLang = l;
  ['en','te','both'].forEach(x => document.getElementById('lopt-'+x).classList.toggle('selected', x===l));
  document.getElementById('lang-continue-btn').classList.add('ready');
}
function goToGoalScreen() { if (!pendingLang) return; showScreen('screen-goal'); }
function selectGoal(g, fromCustom=false) {
  pendingGoal = g;
  if (!fromCustom) { document.getElementById('custom-goal-input').value='';[1,3,5].forEach(v=>document.getElementById('gopt-'+v).classList.toggle('selected',v===g)); }
  else { [1,3,5].forEach(v=>document.getElementById('gopt-'+v).classList.remove('selected')); }
  document.getElementById('goal-continue-btn').classList.toggle('ready', !!g && g>0);
}
function confirmGoal() {
  if (!pendingGoal || pendingGoal < 1) return;
  dailyGoal    = pendingGoal;
  currentLang  = pendingLang;
  hasOnboarded = true;
  applyLang(pendingLang);
  saveState();
  showScreen('screen-home');
  updateNavActive('home');
  renderHome();
}

/* ════════════════════════════════════════════
   LANGUAGE
   ════════════════════════════════════════════ */
function applyLang(l) {
  currentLang          = l;
  readingDisplayLang   = (l === 'te') ? 'te' : 'en';
  bibleLang            = (l === 'te') ? 'te' : 'en';
  bfrLang              = (l === 'te') ? 'te' : 'en';
  document.getElementById('home-lang-pill').textContent   = LANG_LABELS[l];
  document.getElementById('reading-lang-tag').textContent = LANG_TAG_SHORT[l];
  const showEN = (l==='en'||l==='both'), showTE = (l==='te'||l==='both');
  document.getElementById('home-verse-en').style.display = showEN ? 'block' : 'none';
  document.getElementById('home-verse-te').style.display = showTE ? 'block' : 'none';
  document.getElementById('lang-toggle-tabs').classList.toggle('visible', l==='both');
  ['en','te','both'].forEach(x => document.getElementById('lset-'+x).classList.toggle('active-lang', x===l));
}
function changeLang(l) { applyLang(l); saveState(); renderHome(); }
function switchReadingLang(lang) {
  readingDisplayLang = lang;
  document.getElementById('tab-en').classList.toggle('active-tab', lang==='en');
  document.getElementById('tab-te').classList.toggle('active-tab', lang==='te');
  document.getElementById('passage-en').style.display = (lang==='en') ? 'block' : 'none';
  document.getElementById('passage-te').style.display = (lang==='te') ? 'block' : 'none';
  // Re-attach Read Aloud to whichever passage is now visible, since the
  // hidden one's utterances shouldn't keep running in the background.
  reattachJourneyReadAloud();
}

/** Re-points the Read Aloud player at whichever passage-en/te div is
 *  currently visible in the Journey reading screen, without re-rendering
 *  the passage HTML (avoids recursing through renderPassage). */
function reattachJourneyReadAloud() {
  if (!window.ReadAloud) return;
  const plan = PLAN.find(p => p.day === activeDayNum);
  if (!plan) { ReadAloud.detach(); return; }
  const activeIsTe = (currentLang === 'te') || (currentLang === 'both' && readingDisplayLang === 'te');
  const activeDiv  = document.getElementById(activeIsTe ? 'passage-te' : 'passage-en');
  const failed     = activeIsTe ? bibleLoadError.te : bibleLoadError.en;
  const doc        = activeIsTe ? bibleDataTE : bibleDataEN;
  if (failed || !activeDiv) { ReadAloud.detach(); return; }
  const verses = getVerses(doc, plan.bookIdx, plan.chapter);
  if (!verses.length) { ReadAloud.detach(); return; }
  const pt = activeDiv.querySelector('.passage-text');
  ReadAloud.attach({
    containerEl: activeDiv,
    verses: verses,
    lang: activeIsTe ? 'te' : 'en',
    mountBeforeEl: pt
  });
}

/* ════════════════════════════════════════════
   HOME RENDER
   ════════════════════════════════════════════ */
function renderHome() {
  const doneCount  = Object.keys(completedDays).length;
  const currentDay = Math.min(doneCount + 1, PLAN.length);
  const todayPlan  = PLAN[currentDay - 1];
  const vod        = getVerseOfTheDay();
  const lv         = getLevel(totalXP);
  const nextXP     = nextLevelXP(totalXP);
  const pct        = Math.round(((totalXP - lv.min) / (nextXP - lv.min)) * 100);

  const greetEl = document.getElementById('home-greeting');
  if (greetEl) {
    const hr = new Date().getHours();
    greetEl.textContent = (hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening') + ' ✦';
  }

  document.getElementById('home-streak').textContent  = streak;
  document.getElementById('home-xp').textContent      = totalXP.toLocaleString() + ' XP';
  document.getElementById('home-level').textContent   = 'Level ' + (lv.idx+1) + ' — ' + lv.name;
  document.getElementById('xp-level-lbl').textContent = 'Level ' + (lv.idx+1);
  document.getElementById('xp-fraction').textContent  = (totalXP-lv.min) + ' / ' + (nextXP-lv.min) + ' XP';
  document.getElementById('xp-bar-fill').style.width  = pct + '%';
  document.getElementById('home-verse-en').textContent = vod.en;
  document.getElementById('home-verse-te').textContent = vod.te;
  document.getElementById('home-verse-ref').textContent = '— ' + vod.ref;

  // Week strip
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const wg = document.getElementById('week-grid'); wg.innerHTML='';
  days.forEach((d, i) => {
    const done  = i < doneCount && doneCount > 0;
    const today = i === Math.min(doneCount, 6);
    const chip  = document.createElement('div');
    chip.className = 'day-chip' + (done ? ' done' : today ? ' today' : '');
    chip.innerHTML = `<span class="day-label">${d.toUpperCase()}</span><span class="day-icon">${done?'✓':today?'📖':'·'}</span>`;
    wg.appendChild(chip);
  });

  // Today banner
  const todayDone = completedDays[currentDay];
  const estMin    = Math.round((CHAPTER_COUNTS[todayPlan.bookIdx] > 0 ? CHAPTER_COUNTS[todayPlan.bookIdx] : 20) * 20 / 60);
  document.getElementById('today-tag').textContent         = 'Day ' + currentDay + ' · ' + todayPlan.testament;
  document.getElementById('today-title').textContent       = todayPlan.title;
  document.getElementById('today-ref').textContent         = todayPlan.ref + ' · ' + todayPlan.book + ' ' + todayPlan.chapter;
  document.getElementById('today-verses-pill').textContent = '⏱ ~' + estMin + ' min';
  document.getElementById('today-action').innerHTML = todayDone
    ? '<div class="today-done-badge">✓ Completed Today — Great work!</div>'
    : `<button class="today-btn" onclick="openDay(${currentDay})">Begin Day ${currentDay} →</button>`;

  // Journey nodes
  const start = Math.max(0, currentDay - 3);
  const slice = PLAN.slice(start, start + 7);
  const jp = document.getElementById('journey-path'); jp.innerHTML='';
  slice.forEach(p => {
    const done = !!completedDays[p.day], isCur = p.day===currentDay, locked = p.day>currentDay;
    const div  = document.createElement('div'); div.className='journey-node';
    div.onclick = () => { if (!locked) openDay(p.day); };
    div.innerHTML = `
      <div class="node-circle ${done?'node-done':isCur?'node-current':'node-locked'}">${p.day}</div>
      <div class="node-info">
        <div class="node-day">Day ${p.day} · ${p.testament}</div>
        <div class="node-chapter">${p.title}</div>
        <div class="node-ref">${p.ref}</div>
      </div>
      ${done?'<span class="node-badge">⭐</span>':''}
      ${isCur&&!done?'<span class="node-xp">+50 XP</span>':''}
      ${locked?'<span class="node-badge" style="opacity:0.35">🔒</span>':''}`;
    jp.appendChild(div);
  });
  document.getElementById('journey-progress-label').textContent = doneCount + ' / ' + PLAN.length + ' done';
  renderAllDays();
  renderProfile();
}

function renderAllDays() {
  const doneCount  = Object.keys(completedDays).length;
  const currentDay = Math.min(doneCount + 1, PLAN.length);
  document.getElementById('alldays-sub').textContent = 'Day ' + currentDay + ' of ' + PLAN.length + ' · Genesis to Revelation';
  const body = document.getElementById('alldays-body'); body.innerHTML='';
  const testaments = [...new Set(PLAN.map(p => p.testament))];
  testaments.forEach(t => {
    const sec = document.createElement('div'); sec.className='testament-section';
    sec.innerHTML = '<div class="testament-label">' + t + '</div>';
    PLAN.filter(p => p.testament===t).forEach(p => {
      const done = !!completedDays[p.day], isCur = p.day===currentDay, locked = p.day>currentDay;
      const row  = document.createElement('div');
      row.className = 'all-node' + (locked ? ' locked-row' : '');
      row.onclick   = () => { if (!locked) openDay(p.day); };
      row.innerHTML = `
        <div class="all-node-num ${done?'all-done':isCur?'all-current':'all-locked'}">${p.day}</div>
        <div class="all-info">
          <div class="all-chapter">${p.title}</div>
          <div class="all-ref">${p.ref} · ${p.book} ${p.chapter}</div>
        </div>
        <span class="all-badge">${done?'⭐':isCur?'▶':locked?'🔒':''}</span>`;
      sec.appendChild(row);
    });
    body.appendChild(sec);
  });
}

function renderProfile() {
  const doneCount = Object.keys(completedDays).length;
  const lv        = getLevel(totalXP);
  document.getElementById('stats-level-label').textContent = 'Level '+(lv.idx+1)+' — '+lv.name+' · '+totalXP+' XP';
  document.getElementById('st-streak').textContent = streak;
  document.getElementById('st-days').textContent   = doneCount;
  document.getElementById('st-xp').textContent     = totalXP;
  document.getElementById('st-pct').textContent    = Math.round((doneCount / PLAN.length) * 100) + '%';
  const bw = document.getElementById('badges-wrap'); bw.innerHTML='';
  [{icon:'📜',name:'First Scroll',earned:doneCount>=1},{icon:'🔥',name:'Week Warrior',earned:streak>=7},{icon:'⭐',name:'Perfect Score',earned:totalXP>=150},{icon:'📖',name:'30 Day Reader',earned:doneCount>=30},{icon:'✟',name:'Faithful Seeker',earned:doneCount>=PLAN.length}].forEach(b => {
    const d = document.createElement('div'); d.className='badge-item'; d.style.opacity=b.earned?'1':'0.3';
    d.innerHTML=`<span class="badge-icon">${b.icon}</span>${b.name}`; bw.appendChild(d);
  });
  // Bible Journey badges (earned in the separate mini-game module) tack onto the same row.
  if (window.BibleJourney && typeof BibleJourney.getEarnedBadges === 'function') {
    BibleJourney.getEarnedBadges().forEach(b => {
      const d = document.createElement('div'); d.className='badge-item';
      d.innerHTML=`<span class="badge-icon">${b.icon}</span>${b.name}`; bw.appendChild(d);
    });
  }
}

/* ════════════════════════════════════════════
   JOURNEY READING  (uses live XML)
   ════════════════════════════════════════════ */
async function openDay(dayNum) {
  const plan = PLAN.find(p => p.day === dayNum);
  if (!plan) return;
  activeDayNum = dayNum;
  document.getElementById('reading-chapter-title').textContent = plan.book + ' ' + plan.chapter;
  document.getElementById('reading-book-sub').textContent      = plan.title;
  document.getElementById('quiz-chapter-label').textContent    = plan.ref;
  await renderPassage(plan);
  resetTimer();
  showScreen('screen-reading');
  updateNavActive('');
}
function openTodayReading() { openDay(Object.keys(completedDays).length + 1); }

async function renderPassage(plan) {
  if (window.ReadAloud) ReadAloud.detach();
  const showEN = (currentLang !== 'te');
  const showTE = (currentLang !== 'en');
  const enDiv  = document.getElementById('passage-en');
  const teDiv  = document.getElementById('passage-te');
  enDiv.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--ink-light)"><div style="font-size:36px">✟</div><div style="margin-top:12px;font-family:Lora,serif;font-style:italic">Loading verses…</div></div>';
  teDiv.innerHTML = enDiv.innerHTML;
  let versesEN = [], versesTE = [];
  if (showEN) {
    versesEN = getVerses(bibleDataEN, plan.bookIdx, plan.chapter);
    enDiv.innerHTML = bibleLoadError.en
      ? bibleErrorHTML('en')
      : versesToHTML(versesEN, plan.book, plan.chapter, 'en');
  }
  if (showTE) {
    versesTE = getVerses(bibleDataTE, plan.bookIdx, plan.chapter);
    teDiv.innerHTML = bibleLoadError.te
      ? bibleErrorHTML('te')
      : versesToHTML(versesTE, plan.bookTE, plan.chapter, 'te');
  }
  if (currentLang === 'both') {
    document.getElementById('lang-toggle-tabs').classList.add('visible');
    switchReadingLang(readingDisplayLang);
  } else {
    document.getElementById('lang-toggle-tabs').classList.remove('visible');
    enDiv.style.display = (currentLang === 'te') ? 'none' : 'block';
    teDiv.style.display = (currentLang === 'te') ? 'block' : 'none';
  }

  // Wire up Read Aloud for whichever language passage is currently visible
  reattachJourneyReadAloud();
}

/* ════════════════════════════════════════════
   TIMER
   ════════════════════════════════════════════ */
function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval); timerRunning=false;
    document.getElementById('timer-toggle-btn').textContent='▶ Resume';
  } else {
    timerInterval = setInterval(() => {
      timerSec++;
      const m=Math.floor(timerSec/60),s=timerSec%60;
      document.getElementById('timer-display').textContent=m+':'+(s<10?'0':'')+s;
      const plan=PLAN.find(p=>p.day===activeDayNum),est=plan?plan.verses*20:300;
      document.getElementById('timer-fill').style.width=Math.min((timerSec/est)*100,100)+'%';
    },1000);
    timerRunning=true;
    document.getElementById('timer-toggle-btn').textContent='⏸ Pause';
  }
}
function resetTimer() {
  clearInterval(timerInterval); timerRunning=false; timerSec=0;
  document.getElementById('timer-display').textContent='0:00';
  document.getElementById('timer-fill').style.width='0%';
  document.getElementById('timer-toggle-btn').textContent='▶ Start';
}
function updateReadingProgress() {
  const el=document.getElementById('reading-scroll');
  const pct=Math.min(Math.round((el.scrollTop/(el.scrollHeight-el.clientHeight))*100),100)||0;
  document.getElementById('progress-fill').style.width=pct+'%';
  document.getElementById('progress-pct').textContent=pct+'%';
}
function finishReading() { if(timerRunning)toggleTimer(); if(window.ReadAloud)ReadAloud.detach(); startQuiz(); }

/* ════════════════════════════════════════════
   QUIZ
   ════════════════════════════════════════════ */
function startQuiz() {
  curQ=0;score=0;answered=false;
  activeQuiz=QUIZ_BANK[activeDayNum]||DEFAULT_QUIZ;
  document.getElementById('quiz-q-label').textContent='Q1 / '+activeQuiz.length;
  renderQuestion(); showScreen('screen-quiz'); updateNavActive('');
}
function buildDots() {
  const c=document.getElementById('quiz-dots');c.innerHTML='';
  activeQuiz.forEach((_,i)=>{const d=document.createElement('div');d.className='qp-dot';if(i<curQ)d.classList.add('done');else if(i===curQ)d.classList.add('active');c.appendChild(d);});
}
function renderQuestion() {
  answered=false;const q=activeQuiz[curQ];
  document.getElementById('q-num-label').textContent='QUESTION '+(curQ+1);
  document.getElementById('q-text').textContent=q.q;
  document.getElementById('quiz-q-label').textContent='Q'+(curQ+1)+' / '+activeQuiz.length;
  buildDots();
  const wrap=document.getElementById('options-wrap');wrap.innerHTML='';
  q.opts.forEach((o,i)=>{const btn=document.createElement('button');btn.className='option-btn';btn.innerHTML=`<span class="option-letter">${['A','B','C','D'][i]}</span>${o}`;btn.onclick=()=>selectAnswer(i);wrap.appendChild(btn);});
  document.getElementById('result-banner').style.display='none';
  document.getElementById('result-banner').className='result-banner';
  document.getElementById('next-btn').className='next-q-btn';
}
function selectAnswer(i) {
  if(answered)return;answered=true;const q=activeQuiz[curQ];
  const btns=document.querySelectorAll('#options-wrap .option-btn');
  btns.forEach(b=>b.classList.add('disabled'));
  const banner=document.getElementById('result-banner');
  if(i===q.ans){btns[i].classList.add('correct');score++;banner.className='result-banner correct';banner.textContent='✓ Correct! Well done!';}
  else{btns[i].classList.add('wrong');btns[q.ans].classList.add('correct');banner.className='result-banner wrong';banner.textContent='✗ Not quite — see the correct answer.';}
  banner.style.display='block';
  document.getElementById('next-btn').className='next-q-btn show';
}
function nextQuestion() { curQ++;if(curQ>=activeQuiz.length)showScore();else renderQuestion(); }
function showScore() {
  const xp=50+score*10,m=Math.floor(timerSec/60),s=timerSec%60;
  if(!completedDays[activeDayNum]){completedDays[activeDayNum]=true;totalXP+=xp;updateStreak();saveState();}
  document.getElementById('final-correct').textContent=score+'/'+activeQuiz.length;
  document.getElementById('final-streak-val').textContent=streak+'🔥';
  document.getElementById('final-time').textContent=timerSec>0?(m+':'+(s<10?'0':'')+s):'—';
  document.getElementById('final-day').textContent='Day '+activeDayNum;
  document.getElementById('xp-earned-val').textContent='+'+xp+' XP';
  document.getElementById('xp-breakdown').textContent='50 reading + '+(score*10)+' quiz bonus';
  const allRight=score===activeQuiz.length,mostRight=score>=Math.ceil(activeQuiz.length*0.6);
  document.getElementById('score-trophy').textContent=allRight?'🏆':mostRight?'⭐':'📖';
  document.getElementById('score-sub-text').textContent=allRight?'"Well done, good and faithful servant."':mostRight?'Great effort! Keep seeking the Word.':"Keep reading — you'll grow in wisdom!";
  showScreen('screen-score');if(allRight)launchConfetti();
}
function launchConfetti() {
  const colors=['#C9A84C','#1B6B45','#8B1A1A','#F0D080','#2A9E68'];
  const c=document.getElementById('confetti-container');
  for(let i=0;i<40;i++){const p=document.createElement('div');p.className='confetti-piece';p.style.left=Math.random()*100+'%';p.style.background=colors[Math.floor(Math.random()*colors.length)];p.style.width=(Math.random()*8+4)+'px';p.style.height=(Math.random()*8+4)+'px';p.style.animationDuration=(Math.random()*2+1.5)+'s';p.style.animationDelay=(Math.random()*0.8)+'s';c.appendChild(p);setTimeout(()=>p.remove(),3500);}
}

/* ════════════════════════════════════════════
   BIBLE BROWSER  (fully live from XML)
   ════════════════════════════════════════════ */

function getBibleBooks(testament) {
  const isOT = testament === 'ot';
  const start = isOT ? 0 : 39;
  const end   = isOT ? 39 : 66;
  return Array.from({length: end - start}, (_, i) => ({
    idx:      start + i,
    en:       BOOK_NAMES_EN[start + i],
    te:       BOOK_NAMES_TE[start + i],
    cat:      BOOK_CATS[start + i],
    chapters: CHAPTER_COUNTS[start + i],
  }));
}

function renderBibleBookList() {
  const list = document.getElementById('bible-book-list');
  list.innerHTML = '';
  const q      = bibleSearch.trim().toLowerCase();
  let   books  = getBibleBooks(bibleTab);
  if (q) {
    books = books.filter(b => b.en.toLowerCase().includes(q) || b.te.includes(q));
    if (books.length === 0) {
      // Search across both testaments
      books = [...getBibleBooks('ot'), ...getBibleBooks('nt')].filter(b => b.en.toLowerCase().includes(q) || b.te.includes(q));
    }
  }
  // Group by category
  const cats = [...new Set(books.map(b => b.cat))];
  const planMap = {};
  PLAN.forEach(p => { planMap[p.bookIdx] = planMap[p.bookIdx] || []; planMap[p.bookIdx].push(p.chapter); });

  cats.forEach(cat => {
    const label = document.createElement('div');
    label.className = 'bible-cat-label';
    label.textContent = cat;
    list.appendChild(label);

    books.filter(b => b.cat === cat).forEach(book => {
      const row     = document.createElement('div');
      row.className = 'bible-book-row';
      row.onclick   = () => openBibleBook(book.idx);
      const inPlan  = !!planMap[book.idx];
      const showTE  = (bibleLang === 'te');
      row.innerHTML = `
        <div class="bible-book-num">${book.idx + 1}</div>
        <div class="bible-book-info">
          <div class="bible-book-name">${showTE ? book.te : book.en}</div>
          ${showTE ? `<div class="bible-book-name-te" style="font-size:11px;color:var(--ink-light)">${book.en}</div>` : ''}
          <div class="bible-book-chapters">${book.chapters} chapters${inPlan ? ' · <span style="color:var(--emerald);font-weight:600">In your plan ✓</span>' : ''}</div>
        </div>
        <div class="bible-book-arrow">›</div>`;
      list.appendChild(row);
    });
  });

  if (cats.length === 0) {
    list.innerHTML = '<div style="padding:48px 20px;text-align:center;color:var(--ink-light);font-family:Lora,serif;font-style:italic">No books found</div>';
  }
}

function setBibleTab(tab) {
  bibleTab = tab;
  document.getElementById('btab-ot').classList.toggle('active-btab', tab==='ot');
  document.getElementById('btab-nt').classList.toggle('active-btab', tab==='nt');
  renderBibleBookList();
}

function setBibleLang(l) {
  bibleLang = l;
  document.getElementById('blang-en').classList.toggle('active-blang', l==='en');
  document.getElementById('blang-te').classList.toggle('active-blang', l==='te');
  renderBibleBookList();
}

function filterBibleBooks(q) {
  bibleSearch = q;
  renderBibleBookList();
}

function openBibleBook(bookIdx) {
  bfrBookIdx = bookIdx;
  bfrChapter = 1;
  const bookNameEN = BOOK_NAMES_EN[bookIdx];
  const bookNameTE = BOOK_NAMES_TE[bookIdx];
  const chapCount  = CHAPTER_COUNTS[bookIdx];
  // Use XML chapter count if available
  const xmlCount   = (bibleLang==='te' && bibleDataTE)
    ? getChapterCount(bibleDataTE, bookIdx)
    : (bibleDataEN ? getChapterCount(bibleDataEN, bookIdx) : chapCount);
  const displayCount = xmlCount || chapCount;

  document.getElementById('bcp-book-name').textContent = bibleLang==='te' ? bookNameTE : bookNameEN;
  document.getElementById('bcp-book-sub').textContent  = displayCount + ' chapters';
  document.getElementById('bcp-lang-tag').textContent  = bibleLang==='te' ? 'TE' : 'EN';

  // Build chapter grid
  const grid = document.getElementById('bcp-grid');
  grid.innerHTML = '';
  const planChaps = PLAN.filter(p => p.bookIdx === bookIdx).map(p => p.chapter);
  for (let c = 1; c <= displayCount; c++) {
    const btn = document.createElement('button');
    btn.className = 'bcp-chapter-btn' + (planChaps.includes(c) ? ' in-plan' : '');
    btn.textContent = c;
    if (planChaps.includes(c)) btn.title = 'In your journey plan';
    btn.onclick = () => openBibleChapter(bookIdx, c);
    grid.appendChild(btn);
  }

  document.getElementById('bible-books-view').style.display   = 'none';
  document.getElementById('bible-chapters-view').style.display = 'flex';
}

function closeBibleChapterPicker() {
  document.getElementById('bible-chapters-view').style.display = 'none';
  document.getElementById('bible-books-view').style.display    = 'flex';
}

async function openBibleChapter(bookIdx, chapter) {
  bfrBookIdx = bookIdx;
  bfrChapter = chapter;
  const bookNameEN = BOOK_NAMES_EN[bookIdx];
  const bookNameTE = BOOK_NAMES_TE[bookIdx];
  bfrLang = (bibleLang === 'te') ? 'te' : 'en';

  document.getElementById('bfr-title').textContent = (bfrLang==='te' ? bookNameTE : bookNameEN) + ' ' + chapter;
  document.getElementById('bfr-sub').textContent   = bfrLang==='te' ? bookNameTE : bookNameEN;

  const totalChaps = CHAPTER_COUNTS[bookIdx];
  document.getElementById('bfr-prev').style.opacity = chapter > 1           ? '1' : '0.3';
  document.getElementById('bfr-next').style.opacity = chapter < totalChaps  ? '1' : '0.3';

  setBfrLang(bfrLang);
  await renderBfrBody();

  // Check if this chapter is in journey plan
  const planDay = PLAN.find(p => p.bookIdx===bookIdx && p.chapter===chapter);
  const btn     = document.getElementById('bfr-journey-btn');
  if (planDay) {
    btn.textContent = completedDays[planDay.day]
      ? '✓ Completed in Journey (Day ' + planDay.day + ')'
      : '📖 Open as Journey Day ' + planDay.day + ' (with Quiz)';
    btn.onclick = () => { if (!completedDays[planDay.day]) openDay(planDay.day); };
  } else {
    btn.textContent = '📖 Free Reading — No streak or quiz';
    btn.onclick = () => {};
  }

  document.getElementById('bible-chapters-view').style.display = 'none';
  document.getElementById('bible-read-view').style.display     = 'flex';
}

function closeBibleFreeRead() {
  if (window.ReadAloud) ReadAloud.detach();
  document.getElementById('bible-read-view').style.display     = 'none';
  document.getElementById('bible-chapters-view').style.display = 'flex';
}

function setBfrLang(lang) {
  bfrLang = lang;
  document.getElementById('bfr-tab-en').classList.toggle('active-bfr-tab', lang==='en');
  document.getElementById('bfr-tab-te').classList.toggle('active-bfr-tab', lang==='te');
  renderBfrBody();
}

function bfrFontSize(delta) {
  bfrFontSz = Math.max(12, Math.min(22, bfrFontSz + delta));
  renderBfrBody();
}

function bfrNavigate(delta) {
  const newChap = bfrChapter + delta;
  const maxChap = CHAPTER_COUNTS[bfrBookIdx];
  if (newChap < 1 || newChap > maxChap) return;
  bfrChapter = newChap;
  openBibleChapter(bfrBookIdx, bfrChapter);
}

async function renderBfrBody() {
  if (window.ReadAloud) ReadAloud.detach();
  const body      = document.getElementById('bfr-body');
  const isTe      = bfrLang === 'te';
  const doc       = isTe ? bibleDataTE : bibleDataEN;
  const bookName  = isTe ? BOOK_NAMES_TE[bfrBookIdx] : BOOK_NAMES_EN[bfrBookIdx];

  const failed = isTe ? bibleLoadError.te : bibleLoadError.en;
  if (failed) {
    body.innerHTML = bibleErrorHTML(bfrLang);
    return;
  }

  body.innerHTML  = `<div style="text-align:center;padding:48px 0;color:var(--ink-light)"><div style="font-size:36px;margin-bottom:12px">✟</div><div style="font-family:Lora,serif;font-style:italic;font-size:14px">${isTe?'లోడ్ అవుతోంది…':'Loading verses…'}</div></div>`;

  const verses = getVerses(doc, bfrBookIdx, bfrChapter);
  const html   = versesToHTML(verses, bookName, bfrChapter, bfrLang);
  body.innerHTML = html;
  // Apply custom font size
  const pt = body.querySelector('.passage-text');
  if (pt) pt.style.fontSize = bfrFontSz + 'px';

  // Wire up Read Aloud for this chapter (Free Reading view)
  if (window.ReadAloud) {
    ReadAloud.attach({
      containerEl: body,
      verses: verses,
      lang: bfrLang,
      mountBeforeEl: pt // insert the player bar right above the verse text
    });
  }
}

function bfrStartJourneyRead() {
  const planDay = PLAN.find(p => p.bookIdx===bfrBookIdx && p.chapter===bfrChapter);
  if (planDay && !completedDays[planDay.day]) openDay(planDay.day);
}

/* ════════════════════════════════════════════
   NAVIGATION
   ════════════════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll('.screen,.score-screen,.lang-screen,.goal-screen,.splash-screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  target.classList.add('active');
  // Subtle fade+rise entrance on the destination screen (skipped for splash itself).
  if (target.classList.contains('screen')) {
    target.classList.remove('dm-enter');
    void target.offsetWidth; // restart animation
    target.classList.add('dm-enter');
  }
}

/** Fades the splash out, then swaps to the destination screen — used only
 *  at the end of initializeApp() so the transition feels continuous rather
 *  than an instant cut. Adds no artificial delay beyond the CSS duration. */
function leaveSplashTo(id) {
  const splash = document.getElementById('screen-splash');
  if (!splash || !splash.classList.contains('active')) { showScreen(id); return; }
  splash.classList.add('leaving');
  setTimeout(() => { splash.classList.remove('leaving'); showScreen(id); }, 380);
}
function goHome() {
  if (timerRunning) toggleTimer();
  if (window.ReadAloud) ReadAloud.detach();
  renderHome();
  showScreen('screen-home');
  updateNavActive('home');
}
function switchNav(n) {
  if (window.ReadAloud && n !== 'bible') ReadAloud.detach();
  if      (n==='home')    goHome();
  else if (n==='alldays') { renderAllDays(); showScreen('screen-alldays'); updateNavActive('alldays'); }
  else if (n==='bible')   {
    document.getElementById('bible-books-view').style.display   = 'flex';
    document.getElementById('bible-chapters-view').style.display = 'none';
    document.getElementById('bible-read-view').style.display     = 'none';
    document.getElementById('bible-search').value = '';
    bibleSearch = '';
    setBibleLang((currentLang==='te') ? 'te' : 'en');
    renderBibleBookList();
    showScreen('screen-bible');
    updateNavActive('bible');
  }
  else if (n==='kids')  { kidsShowScreen(); updateNavActive('kids'); }
  else if (n==='journey') { if (window.BibleJourney) BibleJourney.openHub(); showScreen('screen-journey'); updateNavActive('journey'); }
  else if (n==='stats') { renderProfile(); showScreen('screen-stats'); updateNavActive('stats'); }
}
function updateNavActive(n) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  // 6-tab layout: home=0, alldays=1, bible=2, kids=3, journey=4, stats=5
  const map = {home:0, alldays:1, bible:2, kids:3, journey:4, stats:5};
  if (!(n in map)) return;
  ['screen-home','screen-alldays','screen-bible','screen-kids','screen-journey','screen-stats'].forEach(sid => {
    const navs = document.querySelectorAll('#'+sid+' .nav-item');
    if (navs[map[n]]) navs[map[n]].classList.add('active');
  });
}

/* ════════════════════════════════════════════
   APP INITIALIZATION  (splash screen flow)

   Order: 1) load saved state  2) load English Bible  3) load Telugu
   Bible  4) validate Bible data  5) init streak  6) init Verse of the
   Day  7) route to onboarding (first-time) or Home (returning user).
   ════════════════════════════════════════════ */
async function initializeApp() {
  const splashStartedAt = Date.now();
  // Floor so the staged splash animation (logo → brand → loader, ~1.3s)
  // always gets to finish playing, even on a fast connection where Bible
  // data loads almost instantly. This is a minimum, not a fixed delay:
  // slower connections are never held back beyond their real load time.
  const MIN_SPLASH_MS = 2200;

  loadTheme();
  updateSplashStatus('Preparing Scripture…');

  // 1. Load saved application state, if any.
  const saved = loadSavedState();
  if (saved) applySavedState(saved);

  // 2 + 3 + 4. Load and validate both Bible datasets.
  const result = await loadBibleData(updateSplashStatus);

  if (!result.enOk && !result.teOk) {
    showSplashError('Unable to load Bible data. Please check your connection and try again.');
    return; // Do not proceed silently — the user must be able to retry.
  }
  if (!result.enOk) console.warn('Proceeding with Telugu only — English Bible failed to load/validate.');
  if (!result.teOk) console.warn('Proceeding with English only — Telugu Bible failed to load/validate.');

  // 5. Initialize streak (recalculate for any missed calendar day).
  recomputeStreakOnLoad();

  // 6. Verse of the Day is date-based and computed on demand by getVerseOfTheDay()
  //    — nothing to precompute here.

  const elapsed = Date.now() - splashStartedAt;
  if (elapsed < MIN_SPLASH_MS) await new Promise(r => setTimeout(r, MIN_SPLASH_MS - elapsed));

  // 7. Route: first-time users go to onboarding, returning users go straight Home.
  if (hasOnboarded && currentLang) {
    applyLang(currentLang);
    renderHome();
    leaveSplashTo('screen-home');
    updateNavActive('home');
  } else {
    leaveSplashTo('screen-lang');
  }
}

function updateSplashStatus(text) {
  const el = document.getElementById('splash-status');
  if (el) el.textContent = text;
}

function showSplashError(message) {
  const loaderWrap = document.getElementById('splash-loader');
  const errorWrap  = document.getElementById('splash-error');
  const errorText  = document.getElementById('splash-error-text');
  if (loaderWrap) loaderWrap.style.display = 'none';
  if (errorText)  errorText.textContent = message; // user-facing message only — no stack traces
  if (errorWrap)  errorWrap.style.display = 'flex';
}

/** Retry button on the splash screen — re-runs the whole init sequence. */
function retryInit() {
  const loaderWrap = document.getElementById('splash-loader');
  const errorWrap  = document.getElementById('splash-error');
  if (errorWrap)  errorWrap.style.display = 'none';
  if (loaderWrap) loaderWrap.style.display = 'flex';
  initializeApp();
}

/* ════════════════════════════════════════════
   INIT — kick off app startup on page load
   ════════════════════════════════════════════ */
loadTheme(); // apply immediately, before splash paints, to avoid a flash
initializeApp();

/* ════════════════════════════════════════════════════════

/* ════════════════════════════════════════════════════════════
   KIDS BIBLE COMIC  — fully offline, no API needed
   All stories & SVG illustrations built-in
   ════════════════════════════════════════════════════════════ */

const KIDS_COMICS = {

  "noah": {
    name: "Noah's Ark", emoji: "🚢", ref: "Genesis 6–9",
    title: "Noah Builds the Big Ark!",
    panels: [
      {
        text: "God saw that people were being unkind. He asked Noah, a good and faithful man, to build a very big boat called an ark!",
        scene: "noah1"
      },
      {
        text: "Noah and his family worked hard every day, hammering and sawing the wood. The ark grew bigger and bigger!",
        scene: "noah2"
      },
      {
        text: "God told Noah to bring two of every animal — elephants, giraffes, lions, and bunnies — into the ark. The animals came marching in!",
        scene: "noah3"
      },
      {
        text: "Rain fell for forty days and nights. But Noah, his family, and all the animals were safe and cozy inside the ark.",
        scene: "noah4"
      },
      {
        text: "The rain stopped and the sun came out. God put a beautiful rainbow in the sky as His promise of love — forever!",
        scene: "noah5"
      }
    ]
  },

  "david": {
    name: "David & Goliath", emoji: "🪨", ref: "1 Samuel 17",
    title: "Brave Little David!",
    panels: [
      {
        text: "A giant soldier named Goliath stomped forward every day, shouting loudly. Everyone was scared — except a young shepherd boy named David!",
        scene: "david1"
      },
      {
        text: "David said, 'God is with me! I am not afraid.' He picked up five smooth stones from the stream.",
        scene: "david2"
      },
      {
        text: "David put a stone in his sling and swung it around and around and around — whoooosh!",
        scene: "david3"
      },
      {
        text: "The stone flew through the air and hit Goliath right on his forehead. The giant fell down with a great big BOOM!",
        scene: "david4"
      },
      {
        text: "Everyone cheered! David showed that with God's help, even the smallest person can do amazingly brave things!",
        scene: "david5"
      }
    ]
  },

  "jonah": {
    name: "Jonah & the Whale", emoji: "🐋", ref: "Jonah 1–2",
    title: "Jonah and the Big Fish!",
    panels: [
      {
        text: "God asked Jonah to go to a faraway city to help the people there. But Jonah got on a boat going the other way!",
        scene: "jonah1"
      },
      {
        text: "A huge storm shook the boat! The waves crashed high. Jonah knew it was because he had run away from God.",
        scene: "jonah2"
      },
      {
        text: "Jonah jumped into the stormy sea — and SPLASH! A gigantic fish swallowed him whole. It was dark and squishy inside!",
        scene: "jonah3"
      },
      {
        text: "Inside the fish, Jonah prayed to God. He said sorry and promised to obey. God heard his prayer!",
        scene: "jonah4"
      },
      {
        text: "The big fish swam to shore and — BLOOP — spat Jonah out onto the beach! Jonah went to help the city, just as God asked.",
        scene: "jonah5"
      }
    ]
  },

  "moses": {
    name: "Baby Moses", emoji: "🌿", ref: "Exodus 2",
    title: "Baby Moses in the Basket!",
    panels: [
      {
        text: "Baby Moses had a loving mother who wanted to keep him safe. She made a little waterproof basket, just his size!",
        scene: "moses1"
      },
      {
        text: "She carefully placed baby Moses in the basket and set it floating gently on the River Nile among the tall reeds.",
        scene: "moses2"
      },
      {
        text: "Moses's sister Miriam hid nearby, watching over her little brother to make sure he was safe.",
        scene: "moses3"
      },
      {
        text: "A princess came to the river to bathe. She heard baby Moses crying, found the basket, and picked him up with a big smile!",
        scene: "moses4"
      },
      {
        text: "The princess adopted Moses and raised him in the palace. God had a wonderful plan for this special baby all along!",
        scene: "moses5"
      }
    ]
  },

  "daniel": {
    name: "Daniel & Lions", emoji: "🦁", ref: "Daniel 6",
    title: "Daniel and the Lions' Den!",
    panels: [
      {
        text: "Daniel loved God very much and prayed three times every day. He was kind, wise, and one of the best helpers in the kingdom!",
        scene: "daniel1"
      },
      {
        text: "Some jealous men made a sneaky rule: 'No one can pray to God!' But Daniel kept on praying, because God comes first!",
        scene: "daniel2"
      },
      {
        text: "The king was very sad but had to follow the rule. Daniel was put into a den full of big, hungry lions. Roarrr!",
        scene: "daniel3"
      },
      {
        text: "But God sent an angel to close the lions' mouths. They became as gentle as kittens! Daniel was completely safe all night.",
        scene: "daniel4"
      },
      {
        text: "In the morning the king ran to the den. 'Daniel!' he called. Daniel walked out perfectly fine! Everyone praised God!",
        scene: "daniel5"
      }
    ]
  },

  "shepherd": {
    name: "The Good Shepherd", emoji: "🐑", ref: "John 10 & Luke 15",
    title: "The Lost Little Sheep!",
    panels: [
      {
        text: "A kind shepherd had one hundred fluffy sheep. He knew every single one by name and loved them all very much!",
        scene: "shepherd1"
      },
      {
        text: "One day, one little sheep wandered off to explore. It got lost in the hills and couldn't find its way home. Baaaa!",
        scene: "shepherd2"
      },
      {
        text: "The shepherd left the ninety-nine safe sheep and went searching. Up hills, through valleys, calling out — 'Where are you?'",
        scene: "shepherd3"
      },
      {
        text: "He found the little lost sheep stuck in some bushes! He gently picked it up and carried it home on his shoulders.",
        scene: "shepherd4"
      },
      {
        text: "'I found my sheep!' the shepherd told everyone happily. Jesus said God loves us just like this shepherd — He always searches for us!",
        scene: "shepherd5"
      }
    ]
  },

  "loaves": {
    name: "Jesus Feeds 5000", emoji: "🍞", ref: "Matthew 14",
    title: "The Miracle of Bread and Fish!",
    panels: [
      {
        text: "Thousands of people came to hear Jesus teach. They listened all day long on a big grassy hillside by the lake.",
        scene: "loaves1"
      },
      {
        text: "Evening came and everyone was hungry. But there was no food nearby — only a little boy with 5 small loaves of bread and 2 fish!",
        scene: "loaves2"
      },
      {
        text: "The little boy gave his lunch to Jesus. Jesus looked up to heaven, said thank you to God, and started breaking the bread.",
        scene: "loaves3"
      },
      {
        text: "The disciples passed the food around and around — and it never ran out! Everyone ate until they were full. What a miracle!",
        scene: "loaves4"
      },
      {
        text: "Twelve baskets of food were left over! Jesus showed that when we share what we have, God can do amazing things with it!",
        scene: "loaves5"
      }
    ]
  },

  "zacchaeus": {
    name: "Zacchaeus", emoji: "🌳", ref: "Luke 19",
    title: "Zacchaeus Climbs a Tree!",
    panels: [
      {
        text: "Zacchaeus was a short man who collected taxes. People didn't like him very much, but he really wanted to see Jesus!",
        scene: "zacch1"
      },
      {
        text: "The streets were packed with people. Zacchaeus couldn't see a thing! So he ran ahead and climbed up a tall sycamore tree.",
        scene: "zacch2"
      },
      {
        text: "Jesus walked right under the tree, looked up, and smiled! 'Zacchaeus, come down! I want to visit your home today!'",
        scene: "zacch3"
      },
      {
        text: "Zacchaeus scrambled down as fast as he could, totally surprised and SO happy. He welcomed Jesus with great joy!",
        scene: "zacch4"
      },
      {
        text: "That day, Zacchaeus promised to give back to everyone he had cheated. Jesus shows us that anyone can change with love!",
        scene: "zacch5"
      }
    ]
  },

  "creation": {
    name: "Creation Story", emoji: "🌍", ref: "Genesis 1",
    title: "God Makes the Beautiful World!",
    panels: [
      {
        text: "In the very beginning, everything was dark and empty. Then God said 'Let there be light!' — and brilliant light filled everything!",
        scene: "creation1"
      },
      {
        text: "God made the beautiful blue sky, the sparkling seas, and the green land with flowers, trees, and plants of every kind!",
        scene: "creation2"
      },
      {
        text: "God made the bright golden sun for the day, the silver moon and twinkling stars to light the night sky.",
        scene: "creation3"
      },
      {
        text: "God filled the world with wonderful creatures — colourful fish in the sea, birds soaring in the sky, animals on the land!",
        scene: "creation4"
      },
      {
        text: "God looked at everything He had made and said 'It is very good!' Then He rested and celebrated His beautiful creation.",
        scene: "creation5"
      }
    ]
  },

  "custom": {
    name: "Your Story", emoji: "✨", ref: "The Bible",
    title: "A Special Bible Story!",
    panels: [
      {
        text: "Long ago, God had a wonderful plan. He chose special people to do amazing things and show His love to the world!",
        scene: "custom1"
      },
      {
        text: "Though the journey was hard, God's chosen one trusted and was brave. With faith, every big mountain can be climbed!",
        scene: "custom2"
      },
      {
        text: "Along the way, God sent helpers, friends, and sometimes even angels to guide and protect His faithful servant.",
        scene: "custom3"
      },
      {
        text: "There were moments of doubt — but also moments of great miracles! God showed His power in the most surprising ways.",
        scene: "custom4"
      },
      {
        text: "In the end, God's plan was perfect. His love never fails, and every story in the Bible shows us how much He cares for us!",
        scene: "custom5"
      }
    ]
  }
};

/* ── Story selection cards ── */
const KIDS_STORY_LIST = [
  { key:"noah",       name:"Noah's Ark",         emoji:"🚢", ref:"Genesis 6–9"   },
  { key:"david",      name:"David & Goliath",     emoji:"🪨", ref:"1 Samuel 17"   },
  { key:"jonah",      name:"Jonah & the Whale",   emoji:"🐋", ref:"Jonah 1–2"     },
  { key:"moses",      name:"Baby Moses",           emoji:"🌿", ref:"Exodus 2"      },
  { key:"daniel",     name:"Daniel & Lions",       emoji:"🦁", ref:"Daniel 6"      },
  { key:"shepherd",   name:"The Lost Sheep",       emoji:"🐑", ref:"Luke 15"       },
  { key:"loaves",     name:"Loaves & Fish",         emoji:"🍞", ref:"Matthew 14"    },
  { key:"zacchaeus",  name:"Zacchaeus",             emoji:"🌳", ref:"Luke 19"       },
  { key:"creation",   name:"Creation Story",        emoji:"🌍", ref:"Genesis 1"     },
];

/* ── Scene SVGs — rich emoji + colour illustrations per panel ── */
const PANEL_SCENES = {

  /* NOAH */
  noah1: { bg:['#87CEEB','#B0E0FF'], ground:'#5D9E5D', objs:[
    {type:'house', x:60, y:80, w:80, h:60, col:'#CD853F'},
    {type:'emoji', e:'👨‍🦳', x:160, y:95, s:38},
    {type:'emoji', e:'📜', x:205, y:90, s:28},
    {type:'emoji', e:'☀️', x:260, y:30, s:36},
    {type:'emoji', e:'🌳', x:20,  y:75, s:36},
  ]},
  noah2: { bg:['#98D8C8','#C8EED8'], ground:'#6BC46B', objs:[
    {type:'ark', x:30, y:55},
    {type:'emoji', e:'🔨', x:165, y:72, s:28},
    {type:'emoji', e:'👨', x:145, y:78, s:34},
    {type:'emoji', e:'👩', x:185, y:80, s:32},
    {type:'emoji', e:'⭐', x:255, y:28, s:22},
  ]},
  noah3: { bg:['#AEE8F8','#D4F5D4'], ground:'#7BC47B', objs:[
    {type:'ark', x:20, y:50},
    {type:'emoji', e:'🐘', x:155, y:90, s:36},
    {type:'emoji', e:'🦒', x:195, y:68, s:38},
    {type:'emoji', e:'🦁', x:235, y:88, s:32},
    {type:'emoji', e:'🐇', x:270, y:98, s:24},
  ]},
  noah4: { bg:['#5B8FCC','#3A6FA8'], ground:'#1A5CA8', objs:[
    {type:'ark', x:60, y:70},
    {type:'emoji', e:'🌧️', x:30,  y:20, s:36},
    {type:'emoji', e:'🌧️', x:130, y:15, s:32},
    {type:'emoji', e:'🌧️', x:220, y:22, s:30},
    {type:'emoji', e:'⚡', x:260, y:35, s:26},
  ]},
  noah5: { bg:['#FFE566','#AEF5AE'], ground:'#62B862', objs:[
    {type:'rainbow', x:0, y:0},
    {type:'ark', x:60, y:90},
    {type:'emoji', e:'🕊️', x:220, y:55, s:34},
    {type:'emoji', e:'🌞', x:255, y:22, s:40},
    {type:'emoji', e:'🦋', x:165, y:50, s:26},
  ]},

  /* DAVID */
  david1: { bg:['#E8D5A0','#C8B478'], ground:'#8B7355', objs:[
    {type:'emoji', e:'⚔️', x:55,  y:70, s:48},
    {type:'emoji', e:'😨', x:150, y:78, s:34},
    {type:'emoji', e:'😨', x:190, y:82, s:30},
    {type:'emoji', e:'😨', x:225, y:80, s:28},
    {type:'emoji', e:'☁️', x:240, y:28, s:30},
  ]},
  david2: { bg:['#C8E8B8','#A0D890'], ground:'#5A9E5A', objs:[
    {type:'emoji', e:'👦', x:130, y:75, s:40},
    {type:'emoji', e:'💧', x:90,  y:115, s:22},
    {type:'emoji', e:'🪨', x:180, y:108, s:26},
    {type:'emoji', e:'🪨', x:205, y:112, s:22},
    {type:'emoji', e:'🌤️', x:245, y:28, s:34},
  ]},
  david3: { bg:['#D4E8C8','#B8D8A0'], ground:'#6AAE6A', objs:[
    {type:'emoji', e:'👦', x:90,  y:72, s:44},
    {type:'emoji', e:'🌀', x:165, y:60, s:38},
    {type:'emoji', e:'💨', x:210, y:55, s:30},
    {type:'emoji', e:'⭐', x:255, y:35, s:26},
    {type:'emoji', e:'🌿', x:28,  y:95, s:28},
  ]},
  david4: { bg:['#F0E8C0','#D8D090'], ground:'#A09050', objs:[
    {type:'emoji', e:'😱', x:55,  y:60, s:52},
    {type:'emoji', e:'💥', x:120, y:42, s:40},
    {type:'emoji', e:'🪨', x:175, y:48, s:30},
    {type:'emoji', e:'👦', x:230, y:78, s:38},
    {type:'emoji', e:'🎉', x:265, y:38, s:28},
  ]},
  david5: { bg:['#FFEEBB','#FFD888'], ground:'#7DAF7D', objs:[
    {type:'emoji', e:'👑', x:135, y:42, s:44},
    {type:'emoji', e:'🙌', x:70,  y:78, s:36},
    {type:'emoji', e:'🙌', x:170, y:80, s:34},
    {type:'emoji', e:'🙌', x:235, y:76, s:36},
    {type:'emoji', e:'✨', x:268, y:38, s:28},
  ]},

  /* JONAH */
  jonah1: { bg:['#A8D8EA','#78C8E8'], ground:'#1A6A9A', objs:[
    {type:'boat', x:80, y:75},
    {type:'emoji', e:'👨', x:145, y:68, s:36},
    {type:'emoji', e:'⛵', x:220, y:82, s:36},
    {type:'emoji', e:'🌊', x:30,  y:108, s:34},
    {type:'emoji', e:'☀️', x:255, y:25, s:38},
  ]},
  jonah2: { bg:['#4A6A8A','#2A4A6A'], ground:'#0A2A5A', objs:[
    {type:'boat', x:70, y:72},
    {type:'emoji', e:'⛈️', x:155, y:18, s:50},
    {type:'emoji', e:'🌊', x:35,  y:110, s:38},
    {type:'emoji', e:'🌊', x:220, y:105, s:36},
    {type:'emoji', e:'⚡', x:255, y:38, s:30},
  ]},
  jonah3: { bg:['#1A4A7A','#0A2A5A'], ground:'#082040', objs:[
    {type:'emoji', e:'🐋', x:50,  y:65, s:90},
    {type:'emoji', e:'😱', x:175, y:70, s:36},
    {type:'emoji', e:'🌊', x:30,  y:115, s:36},
    {type:'emoji', e:'🌊', x:230, y:112, s:34},
    {type:'emoji', e:'🌙', x:258, y:28, s:34},
  ]},
  jonah4: { bg:['#0A2040','#051028'], ground:'#030810', objs:[
    {type:'emoji', e:'🙏', x:130, y:72, s:50},
    {type:'emoji', e:'✨', x:80,  y:45, s:28},
    {type:'emoji', e:'✨', x:195, y:50, s:24},
    {type:'emoji', e:'👼', x:240, y:38, s:36},
    {type:'emoji', e:'💛', x:158, y:38, s:22},
  ]},
  jonah5: { bg:['#87CEEB','#B0E8C8'], ground:'#E8D8A0', objs:[
    {type:'emoji', e:'🐋', x:30,  y:75, s:75},
    {type:'emoji', e:'💦', x:140, y:105, s:32},
    {type:'emoji', e:'🏃', x:205, y:80, s:40},
    {type:'emoji', e:'🌞', x:255, y:22, s:40},
    {type:'emoji', e:'🌈', x:165, y:28, s:40},
  ]},

  /* MOSES */
  moses1: { bg:['#FFEEBB','#FFD888'], ground:'#C8A870', objs:[
    {type:'emoji', e:'👩', x:100, y:68, s:44},
    {type:'emoji', e:'👶', x:165, y:78, s:36},
    {type:'emoji', e:'🧺', x:215, y:88, s:36},
    {type:'emoji', e:'💛', x:155, y:45, s:22},
    {type:'emoji', e:'🌴', x:265, y:58, s:38},
  ]},
  moses2: { bg:['#88D4D8','#60C4C8'], ground:'#208888', objs:[
    {type:'emoji', e:'🌿', x:35,  y:85, s:38},
    {type:'emoji', e:'🧺', x:110, y:88, s:42},
    {type:'emoji', e:'👶', x:120, y:82, s:28},
    {type:'emoji', e:'🌊', x:200, y:108, s:36},
    {type:'emoji', e:'🌴', x:255, y:60, s:42},
  ]},
  moses3: { bg:['#A8E8B8','#88D898'], ground:'#4A9A4A', objs:[
    {type:'emoji', e:'🧺', x:90,  y:92, s:38},
    {type:'emoji', e:'👧', x:180, y:70, s:40},
    {type:'emoji', e:'🌿', x:230, y:88, s:30},
    {type:'emoji', e:'🌿', x:55,  y:90, s:34},
    {type:'emoji', e:'🦋', x:250, y:52, s:24},
  ]},
  moses4: { bg:['#FFF5CC','#FFEEBB'], ground:'#B8A060', objs:[
    {type:'emoji', e:'👸', x:155, y:62, s:48},
    {type:'emoji', e:'🧺', x:100, y:92, s:38},
    {type:'emoji', e:'👶', x:108, y:85, s:28},
    {type:'emoji', e:'😊', x:162, y:112, s:26},
    {type:'emoji', e:'🌸', x:250, y:55, s:30},
  ]},
  moses5: { bg:['#FFE8CC','#FFDDB0'], ground:'#C8A870', objs:[
    {type:'emoji', e:'🏰', x:50,  y:48, s:70},
    {type:'emoji', e:'👑', x:185, y:38, s:40},
    {type:'emoji', e:'👦', x:190, y:72, s:44},
    {type:'emoji', e:'⭐', x:258, y:28, s:28},
    {type:'emoji', e:'✨', x:278, y:55, s:22},
  ]},

  /* DANIEL */
  daniel1: { bg:['#FFEEBB','#FFD888'], ground:'#B8A070', objs:[
    {type:'emoji', e:'🙏', x:130, y:68, s:50},
    {type:'emoji', e:'✨', x:90,  y:45, s:28},
    {type:'emoji', e:'✨', x:188, y:42, s:24},
    {type:'emoji', e:'📜', x:215, y:78, s:32},
    {type:'emoji', e:'🌟', x:262, y:30, s:34},
  ]},
  daniel2: { bg:['#D8C8A0','#C0A880'], ground:'#887050', objs:[
    {type:'emoji', e:'👨', x:130, y:70, s:44},
    {type:'emoji', e:'😠', x:65,  y:68, s:36},
    {type:'emoji', e:'😠', x:210, y:70, s:36},
    {type:'emoji', e:'📜', x:255, y:78, s:30},
    {type:'emoji', e:'🔒', x:153, y:42, s:26},
  ]},
  daniel3: { bg:['#8A7060','#5A4030'], ground:'#3A2010', objs:[
    {type:'emoji', e:'🦁', x:55,  y:78, s:52},
    {type:'emoji', e:'🦁', x:215, y:80, s:50},
    {type:'emoji', e:'👨', x:130, y:72, s:44},
    {type:'emoji', e:'😰', x:145, y:45, s:28},
    {type:'emoji', e:'🙏', x:162, y:95, s:28},
  ]},
  daniel4: { bg:['#5A4030','#3A2810'], ground:'#2A1808', objs:[
    {type:'emoji', e:'👼', x:50,  y:38, s:50},
    {type:'emoji', e:'🦁', x:55,  y:85, s:48},
    {type:'emoji', e:'🦁', x:210, y:83, s:46},
    {type:'emoji', e:'👨', x:135, y:72, s:44},
    {type:'emoji', e:'😊', x:152, y:45, s:30},
  ]},
  daniel5: { bg:['#87CEEB','#FFD888'], ground:'#6AAE6A', objs:[
    {type:'emoji', e:'🤴', x:55,  y:65, s:48},
    {type:'emoji', e:'🏃', x:95,  y:72, s:40},
    {type:'emoji', e:'👨', x:165, y:70, s:44},
    {type:'emoji', e:'🙌', x:230, y:72, s:38},
    {type:'emoji', e:'🌟', x:258, y:28, s:36},
  ]},

  /* SHEPHERD */
  shepherd1: { bg:['#90EE90','#A8F0A8'], ground:'#4A9A4A', objs:[
    {type:'emoji', e:'🧑', x:80,  y:72, s:44},
    {type:'emoji', e:'🐑', x:155, y:82, s:34},
    {type:'emoji', e:'🐑', x:195, y:85, s:32},
    {type:'emoji', e:'🐑', x:232, y:82, s:30},
    {type:'emoji', e:'⛅', x:252, y:28, s:34},
  ]},
  shepherd2: { bg:['#D4E8B8','#B8D8A0'], ground:'#7AAA7A', objs:[
    {type:'emoji', e:'🐑', x:55,  y:78, s:40},
    {type:'emoji', e:'😢', x:68,  y:50, s:28},
    {type:'emoji', e:'🌄', x:170, y:40, s:60},
    {type:'emoji', e:'❓', x:148, y:80, s:28},
    {type:'emoji', e:'🌿', x:240, y:90, s:30},
  ]},
  shepherd3: { bg:['#C8E8B8','#A8D898'], ground:'#5A9A5A', objs:[
    {type:'emoji', e:'🧑', x:120, y:70, s:46},
    {type:'emoji', e:'🔦', x:170, y:60, s:30},
    {type:'emoji', e:'🌙', x:258, y:25, s:36},
    {type:'emoji', e:'⭐', x:230, y:45, s:24},
    {type:'emoji', e:'🌿', x:38,  y:90, s:32},
  ]},
  shepherd4: { bg:['#E8F8D0','#C8E8A8'], ground:'#5A9A5A', objs:[
    {type:'emoji', e:'🧑', x:120, y:60, s:48},
    {type:'emoji', e:'🐑', x:148, y:60, s:36},
    {type:'emoji', e:'💛', x:145, y:36, s:28},
    {type:'emoji', e:'🌸', x:230, y:75, s:28},
    {type:'emoji', e:'🌞', x:258, y:25, s:38},
  ]},
  shepherd5: { bg:['#FFFAAA','#FFE888'], ground:'#5AA85A', objs:[
    {type:'emoji', e:'🧑', x:100, y:68, s:46},
    {type:'emoji', e:'🐑', x:160, y:80, s:36},
    {type:'emoji', e:'🙌', x:215, y:68, s:38},
    {type:'emoji', e:'🎉', x:260, y:42, s:34},
    {type:'emoji', e:'🌈', x:50,  y:28, s:48},
  ]},

  /* LOAVES & FISH */
  loaves1: { bg:['#87CEEB','#C8E8D8'], ground:'#5A9A5A', objs:[
    {type:'emoji', e:'👨‍🏫', x:130, y:55, s:50},
    {type:'emoji', e:'👫', x:60,  y:82, s:34},
    {type:'emoji', e:'👨', x:215, y:80, s:36},
    {type:'emoji', e:'👩', x:255, y:82, s:34},
    {type:'emoji', e:'🌊', x:35,  y:115, s:36},
  ]},
  loaves2: { bg:['#FFEEBB','#FFD898'], ground:'#7AAA7A', objs:[
    {type:'emoji', e:'👦', x:130, y:68, s:46},
    {type:'emoji', e:'🍞', x:175, y:78, s:30},
    {type:'emoji', e:'🐟', x:215, y:80, s:30},
    {type:'emoji', e:'😮', x:58,  y:72, s:36},
    {type:'emoji', e:'😮', x:245, y:74, s:34},
  ]},
  loaves3: { bg:['#D4E8C8','#B4D8A8'], ground:'#5A9A5A', objs:[
    {type:'emoji', e:'🙏', x:115, y:62, s:52},
    {type:'emoji', e:'🍞', x:175, y:72, s:34},
    {type:'emoji', e:'☀️', x:255, y:22, s:40},
    {type:'emoji', e:'✨', x:78,  y:40, s:28},
    {type:'emoji', e:'✨', x:210, y:38, s:24},
  ]},
  loaves4: { bg:['#C8E8D8','#A8D8C0'], ground:'#5A9A5A', objs:[
    {type:'emoji', e:'🍞', x:58,  y:60, s:40},
    {type:'emoji', e:'😊', x:100, y:68, s:36},
    {type:'emoji', e:'🍞', x:148, y:58, s:40},
    {type:'emoji', e:'😊', x:195, y:66, s:34},
    {type:'emoji', e:'🍞', x:245, y:62, s:36},
  ]},
  loaves5: { bg:['#FFF5BB','#FFEEBB'], ground:'#6AAA6A', objs:[
    {type:'emoji', e:'🧺', x:58,  y:78, s:40},
    {type:'emoji', e:'🧺', x:108, y:80, s:38},
    {type:'emoji', e:'🧺', x:158, y:78, s:40},
    {type:'emoji', e:'🧺', x:208, y:80, s:38},
    {type:'emoji', e:'🎉', x:260, y:42, s:36},
  ]},

  /* ZACCHAEUS */
  zacch1: { bg:['#87CEEB','#C8E8C8'], ground:'#7AAA7A', objs:[
    {type:'emoji', e:'🌳', x:50,  y:40, s:80},
    {type:'emoji', e:'👨', x:218, y:74, s:34},
    {type:'emoji', e:'😐', x:228, y:48, s:28},
    {type:'emoji', e:'💰', x:258, y:78, s:30},
    {type:'emoji', e:'☀️', x:268, y:22, s:34},
  ]},
  zacch2: { bg:['#AAEEAA','#88D888'], ground:'#4A9A4A', objs:[
    {type:'emoji', e:'🌳', x:45,  y:28, s:95},
    {type:'emoji', e:'🧗', x:88,  y:52, s:40},
    {type:'emoji', e:'👫', x:185, y:78, s:36},
    {type:'emoji', e:'👨', x:230, y:76, s:34},
    {type:'emoji', e:'⭐', x:265, y:35, s:28},
  ]},
  zacch3: { bg:['#CCEECC','#AADDAA'], ground:'#4A9A4A', objs:[
    {type:'emoji', e:'🌳', x:40,  y:28, s:92},
    {type:'emoji', e:'😮', x:88,  y:48, s:36},
    {type:'emoji', e:'👨‍🏫', x:190, y:62, s:52},
    {type:'emoji', e:'💛', x:145, y:52, s:30},
    {type:'emoji', e:'🌟', x:260, y:30, s:36},
  ]},
  zacch4: { bg:['#FFEEBB','#FFD888'], ground:'#6AAA6A', objs:[
    {type:'emoji', e:'🌳', x:35,  y:35, s:80},
    {type:'emoji', e:'🏃', x:100, y:72, s:44},
    {type:'emoji', e:'😄', x:112, y:46, s:32},
    {type:'emoji', e:'👨‍🏫', x:190, y:65, s:50},
    {type:'emoji', e:'🎉', x:262, y:42, s:34},
  ]},
  zacch5: { bg:['#FFFACC','#FFF5AA'], ground:'#5AAA5A', objs:[
    {type:'emoji', e:'🤝', x:120, y:70, s:50},
    {type:'emoji', e:'💛', x:155, y:42, s:30},
    {type:'emoji', e:'💰', x:210, y:88, s:32},
    {type:'emoji', e:'🌈', x:50,  y:28, s:52},
    {type:'emoji', e:'🎊', x:265, y:42, s:34},
  ]},

  /* CREATION */
  creation1: { bg:['#220055','#440088'], ground:'#110033', objs:[
    {type:'emoji', e:'✨', x:65,  y:35, s:44},
    {type:'emoji', e:'💡', x:148, y:45, s:58},
    {type:'emoji', e:'✨', x:235, y:38, s:40},
    {type:'emoji', e:'⭐', x:40,  y:78, s:28},
    {type:'emoji', e:'⭐', x:258, y:72, s:24},
  ]},
  creation2: { bg:['#87CEEB','#AAEEBB'], ground:'#3A9A3A', objs:[
    {type:'emoji', e:'🌸', x:55,  y:78, s:36},
    {type:'emoji', e:'🌊', x:130, y:105, s:40},
    {type:'emoji', e:'🌳', x:205, y:58, s:50},
    {type:'emoji', e:'🌺', x:248, y:82, s:30},
    {type:'emoji', e:'☀️', x:265, y:22, s:40},
  ]},
  creation3: { bg:['#1A2A6A','#0A1A4A'], ground:'#082040', objs:[
    {type:'emoji', e:'🌞', x:80,  y:55, s:70},
    {type:'emoji', e:'🌙', x:205, y:42, s:58},
    {type:'emoji', e:'⭐', x:55,  y:28, s:26},
    {type:'emoji', e:'⭐', x:158, y:22, s:22},
    {type:'emoji', e:'⭐', x:268, y:30, s:24},
  ]},
  creation4: { bg:['#87CEEB','#B8E8D8'], ground:'#4A9A4A', objs:[
    {type:'emoji', e:'🦅', x:65,  y:38, s:46},
    {type:'emoji', e:'🐬', x:90,  y:100, s:44},
    {type:'emoji', e:'🦁', x:175, y:82, s:46},
    {type:'emoji', e:'🦋', x:230, y:52, s:34},
    {type:'emoji', e:'🌊', x:55,  y:112, s:38},
  ]},
  creation5: { bg:['#FFFACC','#FFE888'], ground:'#5AAA5A', objs:[
    {type:'rainbow', x:0, y:0},
    {type:'emoji', e:'🌟', x:70,  y:38, s:44},
    {type:'emoji', e:'🌍', x:150, y:50, s:62},
    {type:'emoji', e:'💛', x:240, y:42, s:38},
    {type:'emoji', e:'✨', x:275, y:65, s:26},
  ]},

  /* CUSTOM / FALLBACK */
  custom1: { bg:['#FFE8CC','#FFD0A0'], ground:'#A89060', objs:[
    {type:'emoji', e:'📖', x:130, y:58, s:58},
    {type:'emoji', e:'✨', x:80,  y:38, s:30},
    {type:'emoji', e:'✨', x:205, y:42, s:26},
    {type:'emoji', e:'⭐', x:258, y:28, s:34},
    {type:'emoji', e:'💛', x:155, y:32, s:24},
  ]},
  custom2: { bg:['#C8E8B8','#A8D898'], ground:'#5A9A5A', objs:[
    {type:'emoji', e:'🧗', x:130, y:52, s:56},
    {type:'emoji', e:'⛰️', x:60,  y:45, s:70},
    {type:'emoji', e:'🌟', x:255, y:28, s:38},
    {type:'emoji', e:'💪', x:198, y:75, s:32},
    {type:'emoji', e:'☀️', x:265, y:22, s:36},
  ]},
  custom3: { bg:['#FFEEBB','#FFD888'], ground:'#7AAA7A', objs:[
    {type:'emoji', e:'👼', x:88,  y:38, s:56},
    {type:'emoji', e:'🤝', x:165, y:70, s:46},
    {type:'emoji', e:'💛', x:148, y:40, s:26},
    {type:'emoji', e:'⭐', x:245, y:35, s:32},
    {type:'emoji', e:'🌸', x:258, y:80, s:26},
  ]},
  custom4: { bg:['#D4C8F0','#B8A8E0'], ground:'#7060A8', objs:[
    {type:'emoji', e:'✨', x:65,  y:38, s:52},
    {type:'emoji', e:'😮', x:150, y:60, s:50},
    {type:'emoji', e:'✨', x:232, y:42, s:48},
    {type:'emoji', e:'💫', x:155, y:28, s:28},
    {type:'emoji', e:'🌟', x:270, y:28, s:30},
  ]},
  custom5: { bg:['#FFFACC','#FFE888'], ground:'#5AAA5A', objs:[
    {type:'rainbow', x:0, y:0},
    {type:'emoji', e:'💛', x:80,  y:55, s:50},
    {type:'emoji', e:'🌍', x:155, y:52, s:56},
    {type:'emoji', e:'🙌', x:228, y:62, s:42},
    {type:'emoji', e:'🎉', x:268, y:38, s:34},
  ]},
};

/* ── Render an SVG scene from a scene descriptor ── */
function kidsBuildSVG(sceneKey) {
  const scene = PANEL_SCENES[sceneKey] || PANEL_SCENES['custom1'];
  const [skyTop, skyBot] = scene.bg;
  const id = sceneKey + Math.random().toString(36).slice(2,6);

  let objects = '';
  for (const obj of scene.objs) {
    if (obj.type === 'emoji') {
      objects += `<text x="${obj.x}" y="${obj.y}" font-size="${obj.s}" dominant-baseline="hanging">${obj.e}</text>\n`;
    } else if (obj.type === 'ark') {
      const x=obj.x, y=obj.y;
      objects += `
        <rect x="${x}" y="${y+20}" width="130" height="50" rx="6" fill="#CD853F"/>
        <rect x="${x+10}" y="${y}" width="110" height="28" rx="4" fill="#DEB887"/>
        <rect x="${x+40}" y="${y-14}" width="50" height="18" rx="3" fill="#C8A870"/>
        <rect x="${x+25}" y="${y+25}" width="20" height="20" rx="3" fill="#8B6914" opacity="0.6"/>
        <rect x="${x+56}" y="${y+25}" width="20" height="20" rx="3" fill="#8B6914" opacity="0.6"/>
        <rect x="${x+87}" y="${y+25}" width="20" height="20" rx="3" fill="#8B6914" opacity="0.6"/>
      `;
    } else if (obj.type === 'boat') {
      const x=obj.x, y=obj.y;
      objects += `
        <ellipse cx="${x+60}" cy="${y+30}" rx="65" ry="22" fill="#DEB887"/>
        <rect x="${x+55}" y="${y-15}" width="6" height="50" fill="#8B6914"/>
        <polygon points="${x+62},${y-12} ${x+62},${y+18} ${x+105},${y+3}" fill="#FF9966" opacity="0.85"/>
      `;
    } else if (obj.type === 'house') {
      const x=obj.x, y=obj.y, w=obj.w, h=obj.h;
      objects += `
        <rect x="${x}" y="${y+h*0.35}" width="${w}" height="${h*0.65}" rx="3" fill="${obj.col}"/>
        <polygon points="${x},${y+h*0.38} ${x+w/2},${y} ${x+w},${y+h*0.38}" fill="#8B4513"/>
        <rect x="${x+w*0.38}" y="${y+h*0.55}" width="${w*0.24}" height="${h*0.45}" rx="2" fill="#6B3410"/>
      `;
    } else if (obj.type === 'rainbow') {
      objects += `
        <path d="M 0 145 Q 150 -20 300 145" stroke="#FF6B6B" stroke-width="9" fill="none" opacity="0.85"/>
        <path d="M 0 145 Q 150  0  300 145" stroke="#FF9944" stroke-width="8" fill="none" opacity="0.8"/>
        <path d="M 0 145 Q 150 15  300 145" stroke="#FFE033" stroke-width="7" fill="none" opacity="0.8"/>
        <path d="M 0 145 Q 150 28  300 145" stroke="#55CC55" stroke-width="7" fill="none" opacity="0.8"/>
        <path d="M 0 145 Q 150 40  300 145" stroke="#4499FF" stroke-width="6" fill="none" opacity="0.8"/>
        <path d="M 0 145 Q 150 50  300 145" stroke="#9966FF" stroke-width="5" fill="none" opacity="0.8"/>
      `;
    }
  }

  return `<svg viewBox="0 0 300 145" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;display:block;border-radius:10px 10px 0 0">
  <defs>
    <linearGradient id="bg_${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${skyTop}"/>
      <stop offset="100%" stop-color="${skyBot}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="145" fill="url(#bg_${id})"/>
  <!-- ground strip -->
  <ellipse cx="150" cy="148" rx="180" ry="35" fill="${scene.ground}" opacity="0.9"/>
  <!-- clouds -->
  <g opacity="0.7">
    <ellipse cx="62" cy="30" rx="30" ry="13" fill="white"/>
    <ellipse cx="80" cy="22" rx="20" ry="12" fill="white"/>
    <ellipse cx="46" cy="25" rx="18" ry="10" fill="white"/>
  </g>
  <g opacity="0.55">
    <ellipse cx="238" cy="38" rx="25" ry="11" fill="white"/>
    <ellipse cx="256" cy="31" rx="17" ry="10" fill="white"/>
  </g>
  ${objects}
</svg>`;
}

/* ── State ── */
let kidsAge       = '5-7';
let lastStoryKey  = '';

/* ── Called by switchNav('kids') ── */
function kidsShowScreen() {
  kidsRenderGrid();
  document.getElementById('kids-loading').style.display  = 'none';
  document.getElementById('kids-error').style.display    = 'none';
  showScreen('screen-kids');
}

function kidsRenderGrid() {
  const grid = document.getElementById('kids-story-grid');
  if (!grid) return;
  grid.innerHTML = KIDS_STORY_LIST.map(s =>
    `<div class="kids-story-card" onclick="kidsLoadStory('${s.key}')">
      <span class="kids-story-emoji">${s.emoji}</span>
      <div class="kids-story-name">${s.name}</div>
      <div class="kids-story-ref">${s.ref}</div>
    </div>`
  ).join('');
}

function setKidsAge(btn, age) {
  kidsAge = age;
  document.querySelectorAll('.kids-age-btn').forEach(b => b.classList.remove('active-age'));
  btn.classList.add('active-age');
}

function closeComic() {
  document.getElementById('kids-comic-area').style.display = 'none';
}

function retryComic() {
  document.getElementById('kids-error').style.display = 'none';
  if (lastStoryKey) kidsLoadStory(lastStoryKey);
}

/* ── Load a preset story by key ── */
function kidsLoadStory(key) {
  const comic = KIDS_COMICS[key] || KIDS_COMICS['custom'];
  lastStoryKey = key;
  document.getElementById('kids-error').style.display     = 'none';
  document.getElementById('kids-loading').style.display   = 'block';
  document.getElementById('kids-comic-area').style.display = 'none';
  document.getElementById('kids-loading').scrollIntoView({ behavior:'smooth', block:'center' });
  // Small delay for visual feedback, then render
  setTimeout(() => {
    document.getElementById('kids-loading').style.display = 'none';
    kidsRenderComic(comic);
  }, 600);
}

/* ── Custom story input: find closest match or use generic ── */
function kidsSearchStory() {
  const input = document.getElementById('kids-custom-input').value.trim().toLowerCase();
  if (!input) { alert('Please type a story name! 😊'); return; }
  // Try to match a key
  const match = Object.entries(KIDS_COMICS).find(([k, v]) =>
    k !== 'custom' && (
      v.name.toLowerCase().includes(input) ||
      input.includes(k) ||
      input.split(' ').some(w => w.length > 3 && v.name.toLowerCase().includes(w))
    )
  );
  if (match) {
    kidsLoadStory(match[0]);
  } else {
    // Use generic story with their title
    const generic = JSON.parse(JSON.stringify(KIDS_COMICS['custom']));
    generic.title = input.charAt(0).toUpperCase() + input.slice(1);
    lastStoryKey = 'custom';
    document.getElementById('kids-error').style.display     = 'none';
    document.getElementById('kids-loading').style.display   = 'block';
    document.getElementById('kids-comic-area').style.display = 'none';
    document.getElementById('kids-loading').scrollIntoView({ behavior:'smooth', block:'center' });
    setTimeout(() => {
      document.getElementById('kids-loading').style.display = 'none';
      kidsRenderComic(generic);
    }, 600);
  }
}

function kidsRenderComic(comic) {
  const area = document.getElementById('kids-comic-area');
  const wrap = document.getElementById('kids-panels-wrap');
  document.getElementById('kids-comic-title').textContent = '📖 ' + (comic.title || 'Bible Story');

  wrap.innerHTML = comic.panels.map((p, i) => {
    const svgHtml = kidsBuildSVG(p.scene);
    return `<div class="kids-panel">
      <div class="kids-panel-img-wrap">
        <span class="kids-panel-num">${i + 1}</span>
        ${svgHtml}
      </div>
      <div class="kids-panel-text">${p.text}</div>
    </div>`;
  }).join('');

  area.style.display = 'block';
  setTimeout(() => area.scrollIntoView({ behavior:'smooth', block:'start' }), 80);
}
