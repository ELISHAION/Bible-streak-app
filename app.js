/* ═══════════════════════════════════════════════════════
   SCRIPTURE JOURNEY — app.js
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

  /* Each verse is its own <div> row — number pill + text side by side */
  const versesHTML = verses.map((v, i) => {
    const num  = i + 1;
    const text = escapeHtml(v);
    return `
      <div class="verse-row">
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

/* ════════════════════════════════════════════
   STARTUP — load XML files
   ════════════════════════════════════════════ */
async function loadBibleData() {
  showBibleLoader(true);
  const [en, te] = await Promise.all([
    fetchBibleXML(BIBLE_XML_EN),
    fetchBibleXML(BIBLE_XML_TE)
  ]);
  bibleDataEN = en;
  bibleDataTE = te;
  bibleLoadError.en = !en;
  bibleLoadError.te = !te;
  showBibleLoader(false);
  console.log('Bible EN loaded:', !!en, '| Bible TE loaded:', !!te);
}

function showBibleLoader(show) {
  let loader = document.getElementById('bible-global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'bible-global-loader';
    loader.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--emerald);color:white;padding:8px 18px;border-radius:20px;font-size:12px;font-weight:600;z-index:999;font-family:Inter,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.2)';
    loader.textContent = '✟ Loading Bible data…';
    document.body.appendChild(loader);
  }
  loader.style.display = show ? 'block' : 'none';
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
  applyLang(pendingLang);
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
function changeLang(l) { applyLang(l); renderHome(); }
function switchReadingLang(lang) {
  readingDisplayLang = lang;
  document.getElementById('tab-en').classList.toggle('active-tab', lang==='en');
  document.getElementById('tab-te').classList.toggle('active-tab', lang==='te');
  document.getElementById('passage-en').style.display = (lang==='en') ? 'block' : 'none';
  document.getElementById('passage-te').style.display = (lang==='te') ? 'block' : 'none';
}

/* ════════════════════════════════════════════
   HOME RENDER
   ════════════════════════════════════════════ */
function renderHome() {
  const doneCount  = Object.keys(completedDays).length;
  const currentDay = Math.min(doneCount + 1, PLAN.length);
  const todayPlan  = PLAN[currentDay - 1];
  const vod        = VERSES_OF_DAY[doneCount % VERSES_OF_DAY.length];
  const lv         = getLevel(totalXP);
  const nextXP     = nextLevelXP(totalXP);
  const pct        = Math.round(((totalXP - lv.min) / (nextXP - lv.min)) * 100);

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
  const showEN = (currentLang !== 'te');
  const showTE = (currentLang !== 'en');
  const enDiv  = document.getElementById('passage-en');
  const teDiv  = document.getElementById('passage-te');
  enDiv.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--ink-light)"><div style="font-size:36px">✟</div><div style="margin-top:12px;font-family:Lora,serif;font-style:italic">Loading verses…</div></div>';
  teDiv.innerHTML = enDiv.innerHTML;
  if (showEN) {
    const verses = getVerses(bibleDataEN, plan.bookIdx, plan.chapter);
    enDiv.innerHTML = versesToHTML(verses, plan.book, plan.chapter, 'en');
  }
  if (showTE) {
    const verses = getVerses(bibleDataTE, plan.bookIdx, plan.chapter);
    teDiv.innerHTML = versesToHTML(verses, plan.bookTE, plan.chapter, 'te');
  }
  if (currentLang === 'both') {
    document.getElementById('lang-toggle-tabs').classList.add('visible');
    switchReadingLang(readingDisplayLang);
  } else {
    document.getElementById('lang-toggle-tabs').classList.remove('visible');
    enDiv.style.display = (currentLang === 'te') ? 'none' : 'block';
    teDiv.style.display = (currentLang === 'te') ? 'block' : 'none';
  }
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
function finishReading() { if(timerRunning)toggleTimer(); startQuiz(); }

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
  if(!completedDays[activeDayNum]){completedDays[activeDayNum]=true;totalXP+=xp;const idx=Object.keys(completedDays).length;streak=(idx===1)?1:Math.min(streak+1,idx);}
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
  const body      = document.getElementById('bfr-body');
  const isTe      = bfrLang === 'te';
  const doc       = isTe ? bibleDataTE : bibleDataEN;
  const bookName  = isTe ? BOOK_NAMES_TE[bfrBookIdx] : BOOK_NAMES_EN[bfrBookIdx];

  body.innerHTML  = `<div style="text-align:center;padding:48px 0;color:var(--ink-light)"><div style="font-size:36px;margin-bottom:12px">✟</div><div style="font-family:Lora,serif;font-style:italic;font-size:14px">${isTe?'లోడ్ అవుతోంది…':'Loading verses…'}</div></div>`;

  const verses = getVerses(doc, bfrBookIdx, bfrChapter);
  const html   = versesToHTML(verses, bookName, bfrChapter, bfrLang);
  body.innerHTML = html;
  // Apply custom font size
  const pt = body.querySelector('.passage-text');
  if (pt) pt.style.fontSize = bfrFontSz + 'px';
}

function bfrStartJourneyRead() {
  const planDay = PLAN.find(p => p.bookIdx===bfrBookIdx && p.chapter===bfrChapter);
  if (planDay && !completedDays[planDay.day]) openDay(planDay.day);
}

/* ════════════════════════════════════════════
   NAVIGATION
   ════════════════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll('.screen,.score-screen,.lang-screen,.goal-screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function goHome() {
  if (timerRunning) toggleTimer();
  renderHome();
  showScreen('screen-home');
  updateNavActive('home');
}
function switchNav(n) {
  if      (n==='home')    goHome();
  else if (n==='alldays') { renderAllDays(); showScreen('screen-alldays'); updateNavActive('alldays'); }
  else if (n==='bible')   {
    document.getElementById('bible-books-view').style.display   = 'flex';
    document.getElementById('bible-chapters-view').style.display = 'none';
    document.getElementById('bible-read-view').style.display     = 'none';
    document.getElementById('bible-search').value = '';
    bibleSearch = '';
    // Sync bible lang to app lang
    setBibleLang((currentLang==='te') ? 'te' : 'en');
    renderBibleBookList();
    showScreen('screen-bible');
    updateNavActive('bible');
  }
  else if (n==='stats')   { renderProfile(); showScreen('screen-stats'); updateNavActive('stats'); }
}
function updateNavActive(n) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const map = {home:0, alldays:1, bible:2, stats:3};
  if (n in map) {
    ['screen-home','screen-alldays','screen-bible','screen-stats'].forEach(sid => {
      const navs = document.querySelectorAll('#'+sid+' .nav-item');
      if (navs[map[n]]) navs[map[n]].classList.add('active');
    });
  }
}

/* ════════════════════════════════════════════
   INIT — fetch XML on page load
   ════════════════════════════════════════════ */
loadBibleData();
