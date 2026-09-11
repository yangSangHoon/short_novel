/**
 * 본문에서 장면을 읽어내기 위한 한국어/영어 키워드 사전.
 *
 * 한국어는 조사가 붙어 늘어나므로("바다가", "바다를") 어간을 그대로 부분 문자열로
 * 검색한다. 형태소 분석기 없이도 실용적인 정확도가 나온다.
 */

export const PLACES = [
  "room",
  "city",
  "forest",
  "sea",
  "mountain",
  "field",
  "school",
  "cafe",
  "road",
  "space",
  "ruins",
] as const;
export type Place = (typeof PLACES)[number];

export const TIMES = ["dawn", "day", "dusk", "night"] as const;
export type TimeOfDay = (typeof TIMES)[number];

export const WEATHERS = ["clear", "cloud", "rain", "snow", "fog"] as const;
export type Weather = (typeof WEATHERS)[number];

export const MOODS = ["calm", "warm", "sad", "tense", "mystic", "bright"] as const;
export type Mood = (typeof MOODS)[number];

export const PROPS = [
  "umbrella",
  "book",
  "sword",
  "flower",
  "cat",
  "bird",
  "lantern",
  "train",
  "letter",
  "cup",
  "boat",
] as const;
export type Prop = (typeof PROPS)[number];

/** 화면에 보여줄 한글 라벨. */
export const LABELS: Record<string, string> = {
  room: "방 안",
  city: "도시",
  forest: "숲",
  sea: "바다",
  mountain: "산",
  field: "들판",
  school: "학교",
  cafe: "카페",
  road: "길",
  space: "우주",
  ruins: "폐허",

  dawn: "새벽",
  day: "낮",
  dusk: "노을",
  night: "밤",

  clear: "맑음",
  cloud: "흐림",
  rain: "비",
  snow: "눈",
  fog: "안개",

  calm: "고요",
  warm: "따뜻",
  sad: "쓸쓸",
  tense: "긴장",
  mystic: "신비",
  bright: "경쾌",

  umbrella: "우산",
  book: "책",
  sword: "검",
  flower: "꽃",
  cat: "고양이",
  bird: "새",
  lantern: "등불",
  train: "기차",
  letter: "편지",
  cup: "찻잔",
  boat: "배",
};

type Dict<T extends string> = Record<T, string[]>;

export const PLACE_WORDS: Dict<Place> = {
  room: ["방", "침대", "이불", "책상", "창문", "커튼", "거실", "부엌", "집 안", "천장", "room", "bed"],
  city: ["도시", "거리", "빌딩", "골목", "신호등", "지하철", "아파트", "횡단보도", "네온", "city", "street"],
  forest: ["숲", "나무", "수풀", "덤불", "이끼", "나뭇잎", "가지", "정글", "forest", "tree", "wood"],
  sea: ["바다", "해변", "파도", "모래", "물결", "항구", "부두", "섬", "sea", "ocean", "beach", "wave"],
  mountain: ["산", "봉우리", "능선", "언덕", "계곡", "절벽", "바위", "고개", "mountain", "cliff", "hill"],
  field: ["들판", "초원", "벌판", "풀밭", "논", "밭", "언덕길", "갈대", "field", "meadow"],
  school: ["학교", "교실", "복도", "운동장", "교복", "칠판", "책가방", "수업", "school", "classroom"],
  cafe: ["카페", "찻집", "커피", "테이블", "잔", "바리스타", "주문", "cafe", "coffee"],
  road: ["길", "도로", "골목길", "정류장", "버스", "역", "기찻길", "철로", "road", "station"],
  space: ["우주", "별빛", "은하", "행성", "우주선", "성운", "궤도", "space", "galaxy", "planet"],
  ruins: ["폐허", "잔해", "무너진", "폐허가", "유적", "버려진", "부서진", "잿더미", "ruin", "rubble"],
};

export const TIME_WORDS: Dict<TimeOfDay> = {
  dawn: ["새벽", "동틀", "여명", "아침", "해가 뜨", "첫차", "dawn", "morning", "sunrise"],
  day: ["낮", "정오", "한낮", "오후", "햇살", "햇빛", "대낮", "noon", "afternoon", "daylight"],
  dusk: ["노을", "저녁", "황혼", "해질", "해 질", "일몰", "붉게 물든", "dusk", "sunset", "evening"],
  night: ["밤", "한밤", "자정", "야심", "어둠", "달빛", "별", "심야", "night", "midnight", "moon"],
};

export const WEATHER_WORDS: Dict<Weather> = {
  clear: ["맑", "화창", "쾌청", "구름 한 점", "clear", "sunny"],
  cloud: ["구름", "흐린", "흐렸", "잔뜩 낀", "먹구름", "cloud", "overcast"],
  rain: ["비", "빗방울", "빗줄기", "소나기", "장대비", "젖", "우산", "장마", "rain", "storm"],
  snow: ["눈", "눈발", "함박눈", "설원", "얼음", "성에", "snow", "frost"],
  fog: ["안개", "자욱", "뿌옇", "흐릿", "습기", "fog", "mist", "haze"],
};

export const MOOD_WORDS: Dict<Mood> = {
  calm: ["고요", "조용", "잔잔", "평온", "천천히", "숨을 골", "calm", "quiet", "still"],
  warm: ["따뜻", "포근", "온기", "미소", "웃", "다정", "설레", "warm", "smile", "gentle"],
  sad: ["슬프", "눈물", "울", "쓸쓸", "외로", "그리", "아프", "이별", "sad", "lonely", "tear"],
  tense: ["긴장", "두려", "무서", "떨", "달렸", "쫓", "비명", "피", "칼", "싸움", "위험", "tense", "fear"],
  mystic: ["신비", "빛나", "마법", "환영", "꿈결", "속삭", "예언", "기이", "mystic", "magic", "strange"],
  bright: ["환하", "밝", "경쾌", "빛이 들", "활기", "달콤", "즐거", "bright", "joy", "cheer"],
};

export const PROP_WORDS: Dict<Prop> = {
  umbrella: ["우산", "umbrella"],
  book: ["책", "노트", "일기", "페이지를", "서점", "book", "diary"],
  sword: ["검", "칼", "칼날", "검을", "베", "sword", "blade"],
  flower: ["꽃", "장미", "벚", "화단", "꽃잎", "flower", "blossom"],
  cat: ["고양이", "야옹", "cat", "kitten"],
  bird: ["새", "날개", "까마귀", "참새", "비둘기", "날아", "bird", "crow", "wing"],
  lantern: ["등불", "랜턴", "촛불", "가로등", "불빛", "등롱", "lantern", "candle", "lamp"],
  train: ["기차", "열차", "전철", "기적 소리", "train"],
  letter: ["편지", "쪽지", "봉투", "우표", "letter", "note"],
  cup: ["잔", "찻잔", "머그", "커피잔", "cup", "mug"],
  boat: ["배", "돛", "나룻배", "보트", "선착장", "boat", "ship", "sail"],
};

/** 인물 수 추정에 쓰이는 단어들. */
export const PERSON_WORDS = [
  "나",
  "그는",
  "그가",
  "그녀",
  "소년",
  "소녀",
  "남자",
  "여자",
  "아이",
  "노인",
  "사람",
  "친구",
  "선생",
  "엄마",
  "아버지",
  "어머니",
  "아빠",
  "우리",
  "그들",
  "he ",
  "she ",
  "they ",
];

export const CROWD_WORDS = ["사람들", "군중", "인파", "무리", "관중", "crowd"];
