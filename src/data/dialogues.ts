export interface DialogueTurn {
  id: number;
  themeEn: string;
  themeKo: string;
  summaryLabel: string;
  /** What the AI partner says at the top of this turn to set the context */
  partnerPromptEn: string;
  partnerPromptKo: string;
  /** The student's target small-talk expression */
  targetSentence: string;
  targetMeaningKo: string;
  /** How the partner replies once the student speaks */
  partnerReplyEn: string;
  partnerReplyKo: string;
  /** Core words/phrases from Section 6 */
  keyWords: string[];
  /** Grammatically possible but pragmatically awkward expression to avoid */
  misleadingSentence: string;
  misleadingPatterns: string[];
  misleadingReasonEn: string;
  misleadingReasonKo: string;
  /** 2nd failure first-letter elicitation hint */
  elicitationMask: string;
  elicitationHintKo: string;
  /** 3rd failure chunked phrase */
  chunks: string[];
  /** Real-life takeaway shown on the Result Screen */
  realLifeTipEn: string;
  realLifeTipKo: string;
}

export interface DialogueLesson {
  id: string;
  title: string;
  subtitleKo: string;
  partnerName: string;
  partnerRole: string;
  settingDescription: string;
  cefrLevel: string;
  turns: DialogueTurn[];
}

export const LESSONS: DialogueLesson[] = [
  {
    id: "traveler-in-korea",
    title: "Meeting a Traveler in Seoul",
    subtitleKo: "외국인 여행객과 자연스럽게 스몰토크 시작하기",
    partnerName: "Alex",
    partnerRole: "Traveler visiting Seoul",
    settingDescription: "Waiting for an iced drink at a sunlit cafe near Namsan",
    cefrLevel: "CEFR B1–B2",
    turns: [
      {
        id: 1,
        themeEn: "Topic 1 · Asking Purpose of Visit",
        themeKo: "한국에 온 계기를 부드럽게 물어보기",
        summaryLabel: "Purpose of visit in Korea",
        partnerPromptEn: "Hi there! Nice weather today. It's my first time in Seoul!",
        partnerPromptKo: "안녕하세요! 오늘 날씨가 참 좋네요. 서울에는 이번이 첫 방문이에요!",
        targetSentence: "What brings you to Korea?",
        targetMeaningKo: "한국에는 어떤 일로 오셨나요?",
        partnerReplyEn: "I am traveling.",
        partnerReplyKo: "여행 중이에요.",
        keyWords: ["bring", "korea"],
        misleadingSentence: "Why are you in Korea?",
        misleadingPatterns: [
          "why are you in korea",
          "why did you come to korea",
          "why are you here",
          "why you in korea",
        ],
        misleadingReasonEn:
          'Using direct questions like "Why" can sound rude or like an interrogation.',
        misleadingReasonKo:
          '"Why"처럼 직접적으로 이유를 캐물으면 무례하거나 심문하는 것처럼 들릴 수 있어요.',
        elicitationMask: "W___ brings you to Korea?",
        elicitationHintKo: "첫 단어는 W로 시작해요.",
        chunks: ["What", "brings you", "to Korea?"],
        realLifeTipEn:
          'Swap "Why are you here?" for "What brings you to...?" to sound welcoming rather than nosy.',
        realLifeTipKo:
          '"Why" 대신 "What brings you to ~?"를 쓰면 훨씬 따뜻하고 환영하는 느낌을 줍니다.',
      },
      {
        id: 2,
        themeEn: "Topic 2 · Checking In on Their Trip",
        themeKo: "상대의 답에 호응하며 지금까지의 인상 묻기",
        summaryLabel: "First impressions so far",
        partnerPromptEn: "I am traveling.",
        partnerPromptKo: "여행 중이에요.",
        targetSentence: "Nice! How is Korea so far?",
        targetMeaningKo: "좋네요! 지금까지 한국은 어때요?",
        partnerReplyEn: "It has been great so far!",
        partnerReplyKo: "지금까지 정말 좋았어요!",
        keyWords: ["nice", "how", "so far"],
        misleadingSentence: "How is Korea?",
        misleadingPatterns: ["how is korea", "hows korea"],
        misleadingReasonEn:
          'Adding a reaction like "Nice!" and "so far" sounds much warmer when their trip is still ongoing.',
        misleadingReasonKo:
          '단답형으로 "How is Korea?"만 묻기보다 "Nice!"로 호응하고 "so far(지금까지)"를 붙이면 훨씬 자연스러워요.',
        elicitationMask: "N___! H__ is Korea so far?",
        elicitationHintKo: "첫 단어는 N으로 시작해요.",
        chunks: ["Nice!", "How is Korea", "so far?"],
        realLifeTipEn:
          'React briefly ("Nice!", "Cool!") before asking your next question, and add "so far" for ongoing trips.',
        realLifeTipKo:
          '짧은 리액션("Nice!")을 먼저 건네고 진행 중인 경험에는 "so far"를 붙여 보세요.',
      },
      {
        id: 3,
        themeEn: "Topic 3 · Asking About Highlights",
        themeKo: "여행 중 가장 좋았던 경험 물어보기",
        summaryLabel: "Favorite highlight of the trip",
        partnerPromptEn: "It has been great so far!",
        partnerPromptKo: "지금까지 정말 좋았어요!",
        targetSentence: "What was your favorite thing?",
        targetMeaningKo: "가장 좋았던 건 무엇이었나요?",
        partnerReplyEn: "The food was so great!",
        partnerReplyKo: "음식이 정말 훌륭했어요!",
        keyWords: ["favorite"],
        misleadingSentence: "What did you do?",
        misleadingPatterns: [
          "what did you do",
          "what did you do in korea",
          "what have you done",
        ],
        misleadingReasonEn:
          '"What did you do?" can feel like checking their schedule; asking about their "favorite thing" invites happy stories.',
        misleadingReasonKo:
          '"What did you do?"는 일정을 확인하는 느낌을 줄 수 있어요. "favorite thing"을 물으면 즐거운 이야기를 나누기 좋아요.',
        elicitationMask: "W___ was your f_______ thing?",
        elicitationHintKo: "첫 단어는 W로 시작해요.",
        chunks: ["What was", "your favorite", "thing?"],
        realLifeTipEn:
          'Ask about "your favorite thing" instead of "what did you do" so strangers only need to share one fun memory.',
        realLifeTipKo:
          '일정을 다 말하게 하는 질문보다 "가장 좋았던 한 가지(favorite thing)"를 물으면 대화가 훨씬 편해집니다.',
      },
      {
        id: 4,
        themeEn: "Topic 4 · Specific Follow-Up on Food",
        themeKo: "음식 이야기에 구체적인 후속 질문 이어가기",
        summaryLabel: "Favorite Korean food",
        partnerPromptEn: "The food was so great!",
        partnerPromptKo: "음식이 정말 훌륭했어요!",
        targetSentence: "What food was your favorite?",
        targetMeaningKo: "어떤 음식이 가장 좋았나요?",
        partnerReplyEn: "I really enjoyed Kimchi.",
        partnerReplyKo: "김치를 정말 맛있게 먹었어요.",
        keyWords: ["food", "favorite"],
        misleadingSentence: "What food did you eat?",
        misleadingPatterns: [
          "what food did you eat",
          "what did you eat",
          "which food did you eat",
        ],
        misleadingReasonEn:
          '"What food did you eat?" asks for a meal log, whereas "What food was your favorite?" keeps the conversation lively.',
        misleadingReasonKo:
          '"무엇을 먹었나요?"라고 나열하게 하기보다 "어떤 음식이 가장 좋았나요?"라고 물으면 대화가 더 활기차져요.',
        elicitationMask: "W___ food was your f_______?",
        elicitationHintKo: "첫 단어는 W로 시작해요.",
        chunks: ["What food", "was your", "favorite?"],
        realLifeTipEn:
          "Echo a word your partner just mentioned ('food') to build an effortless follow-up question.",
        realLifeTipKo:
          "상대가 방금 말한 핵심 단어(food)를 받아서 후속 질문을 만들면 막히지 않고 대화를 이어갈 수 있어요.",
      },
      {
        id: 5,
        themeEn: "Topic 5 · Friendly Closing",
        themeKo: "기분 좋은 여운을 남기며 인사 나누기",
        summaryLabel: "Warm farewell wish",
        partnerPromptEn: "I really enjoyed Kimchi.",
        partnerPromptKo: "김치를 정말 맛있게 먹었어요.",
        targetSentence: "Have a good time in Korea!",
        targetMeaningKo: "한국에서 즐거운 시간 보내세요!",
        partnerReplyEn: "Thank you!",
        partnerReplyKo: "고마워요!",
        keyWords: ["have", "good time"],
        misleadingSentence: "Goodbye.",
        misleadingPatterns: ["goodbye", "good bye", "bye", "bye bye"],
        misleadingReasonEn:
          'Saying just "Goodbye." right away can feel abrupt and cold after a friendly chat.',
        misleadingReasonKo:
          '스몰토크 직후에 "Goodbye."만 말하면 대화를 갑자기 끊는 것처럼 차갑게 느껴질 수 있어요.',
        elicitationMask: "H___ a good time in Korea!",
        elicitationHintKo: "첫 단어는 H로 시작해요.",
        chunks: ["Have a", "good time", "in Korea!"],
        realLifeTipEn:
          'Wrap up small talk with a warm wish like "Have a good time in Korea!" instead of a sudden "Goodbye."',
        realLifeTipKo:
          '스몰토크를 마칠 때는 "Goodbye" 대신 상대의 여행을 응원하는 따뜻한 인사로 마무리해 보세요.',
      },
    ],
  },
  {
    id: "bus-stop-small-talk",
    title: "Bonus Lesson: Helping a Visitor Find Directions",
    subtitleKo: "길 찾는 외국인에게 친절하게 스몰토크 건네기",
    partnerName: "Sam",
    partnerRole: "Exchange visitor in Hongdae",
    settingDescription: "Near Hongik Univ. Station Exit 9 on a sunny afternoon",
    cefrLevel: "CEFR B1–B2",
    turns: [
      {
        id: 1,
        themeEn: "Topic 1 · Offering Friendly Help",
        themeKo: "부담 없이 도움 제안하기",
        summaryLabel: "Offering help politely",
        partnerPromptEn: "Hmm... excuse me, all these subway exits look the same!",
        partnerPromptKo: "음... 실례합니다만 지하철 출구가 다 비슷해 보이네요!",
        targetSentence: "Do you need a hand finding somewhere?",
        targetMeaningKo: "어디 찾으시는 데 도움이 필요하신가요?",
        partnerReplyEn: "Oh, yes please! I'm looking for Gyeongui Line Forest Park.",
        partnerReplyKo: "아, 네! 경의선 숲길을 찾고 있어요.",
        keyWords: ["need", "finding"],
        misleadingSentence: "What do you want?",
        misleadingPatterns: ["what do you want", "where are you going"],
        misleadingReasonEn:
          '"What do you want?" sounds blunt and impatient in English.',
        misleadingReasonKo:
          '"What do you want?"는 영어로 퉁명스럽거나 화난 것처럼 들릴 수 있어요.',
        elicitationMask: "D_ you need a hand finding somewhere?",
        elicitationHintKo: "첫 단어는 D로 시작해요.",
        chunks: ["Do you need a hand", "finding", "somewhere?"],
        realLifeTipEn:
          'Use "Do you need a hand...?" instead of "What do you want?" to offer help warmly.',
        realLifeTipKo:
          '"무엇을 원하세요?"라는 직역 대신 "Do you need a hand?"를 쓰면 훨씬 친절하게 들립니다.',
      },
      {
        id: 2,
        themeEn: "Topic 2 · Reassuring Distance",
        themeKo: "가깝다고 안심시켜 주기",
        summaryLabel: "Giving simple reassurance",
        partnerPromptEn: "Oh, yes please! I'm looking for Gyeongui Line Forest Park.",
        partnerPromptKo: "아, 네! 경의선 숲길을 찾고 있어요.",
        targetSentence: "You are really close! Just turn right at the corner.",
        targetMeaningKo: "아주 가까워요! 모퉁이에서 오른쪽으로 도시면 돼요.",
        partnerReplyEn: "Phew, that is a relief! It looks so lively around here.",
        partnerReplyKo: "휴, 다행이네요! 이 주변이 참 활기차 보여요.",
        keyWords: ["close", "turn right"],
        misleadingSentence: "Go right.",
        misleadingPatterns: ["go right", "turn right"],
        misleadingReasonEn:
          'A bare command like "Go right." can feel abrupt; reassuring them first sounds friendly.',
        misleadingReasonKo:
          '짧은 명령조 표현보다 "가깝다"고 먼저 안심시켜 주면 훨씬 부드러워요.',
        elicitationMask: "Y__ are really close! Just turn right at the corner.",
        elicitationHintKo: "첫 단어는 Y로 시작해요.",
        chunks: ["You are really close!", "Just turn right", "at the corner."],
        realLifeTipEn:
          'Start directions with reassurance ("You are really close!") before giving steps.',
        realLifeTipKo:
          '길을 알려줄 때는 방향 지시 전에 "금방 가요!"라는 안심 멘트를 먼저 건네 보세요.',
      },
      {
        id: 3,
        themeEn: "Topic 3 · Sharing Local Context",
        themeKo: "동네 분위기 소개하며 대화 잇기",
        summaryLabel: "Sharing local vibe",
        partnerPromptEn: "Phew, that is a relief! It looks so lively around here.",
        partnerPromptKo: "휴, 다행이네요! 이 주변이 참 활기차 보여요.",
        targetSentence: "Yeah, it is a popular spot to hang out on weekends.",
        targetMeaningKo: "네, 주말에 놀기 좋은 인기 명소예요.",
        partnerReplyEn: "No wonder! Do locals come here for coffee too?",
        partnerReplyKo: "어쩐지 그렇군요! 현지 분들도 커피 마시러 자주 오나요?",
        keyWords: ["popular", "weekends"],
        misleadingSentence: "Many Koreans exist here.",
        misleadingPatterns: ["many koreans exist here", "many people here"],
        misleadingReasonEn:
          'Saying "popular spot to hang out" sounds much more natural than translating "있다" as "exist".',
        misleadingReasonKo:
          '"사람이 많이 있다"를 직역하기보다 "popular spot to hang out"이라고 표현하면 자연스러워요.',
        elicitationMask: "Y___, it is a popular spot to hang out on weekends.",
        elicitationHintKo: "첫 단어는 Y로 시작해요.",
        chunks: ["Yeah, it is", "a popular spot", "to hang out on weekends."],
        realLifeTipEn:
          '"A popular spot to hang out" is a versatile phrase for describing any local neighborhood.',
        realLifeTipKo:
          '"a popular spot to hang out"을 익혀 두면 한국의 어떤 명소든 자연스럽게 소개할 수 있어요.',
      },
      {
        id: 4,
        themeEn: "Topic 4 · Soft Recommendation",
        themeKo: "부담스럽지 않게 추천 건네기",
        summaryLabel: "Gentle cafe recommendation",
        partnerPromptEn: "No wonder! Do locals come here for coffee too?",
        partnerPromptKo: "어쩐지 그렇군요! 현지 분들도 커피 마시러 자주 오나요?",
        targetSentence: "Definitely! You should check out the bakeries along the park.",
        targetMeaningKo: "그럼요! 공원 따라 있는 베이커리들도 꼭 들러 보세요.",
        partnerReplyEn: "Awesome, I love fresh bread! Thanks for the tip.",
        partnerReplyKo: "멋지네요, 빵 정말 좋아하거든요! 꿀팁 고마워요.",
        keyWords: ["check out", "park"],
        misleadingSentence: "You must eat bread there.",
        misleadingPatterns: ["you must eat bread", "you must go bakery"],
        misleadingReasonEn:
          '"You must..." sounds like a strict rule; "You should check out..." feels like a friendly tip.',
        misleadingReasonKo:
          '"You must"는 의무처럼 들리므로 가벼운 추천에는 "You should check out ~"이 훨씬 좋아요.',
        elicitationMask: "D_________! You should check out the bakeries along the park.",
        elicitationHintKo: "첫 단어는 D로 시작해요.",
        chunks: ["Definitely!", "You should check out", "the bakeries along the park."],
        realLifeTipEn:
          'Use "You should check out..." instead of "You must..." when recommending places.',
        realLifeTipKo:
          '맛집이나 장소를 추천할 때는 강요 느낌의 "must" 대신 "check out"을 사용해 보세요.',
      },
      {
        id: 5,
        themeEn: "Topic 5 · Cheerful Send-Off",
        themeKo: "기분 좋게 산책 응원하며 헤어지기",
        summaryLabel: "Friendly send-off",
        partnerPromptEn: "Awesome, I love fresh bread! Thanks for the tip.",
        partnerPromptKo: "멋지네요, 빵 정말 좋아하거든요! 꿀팁 고마워요.",
        targetSentence: "Enjoy your walk around the neighborhood!",
        targetMeaningKo: "동네 산책 즐겁게 하세요!",
        partnerReplyEn: "Thanks so much! Have a great day!",
        partnerReplyKo: "정말 고마워요! 좋은 하루 보내세요!",
        keyWords: ["enjoy", "walk"],
        misleadingSentence: "Okay bye.",
        misleadingPatterns: ["okay bye", "ok bye", "goodbye"],
        misleadingReasonEn:
          '"Okay bye." can cut the conversation short; "Enjoy your walk!" leaves a warm impression.',
        misleadingReasonKo:
          '"Okay bye"보다 상대가 지금 하려는 일(산책)을 응원하며 인사하면 훨씬 따뜻한 인상을 남깁니다.',
        elicitationMask: "E____ your walk around the neighborhood!",
        elicitationHintKo: "첫 단어는 E로 시작해요.",
        chunks: ["Enjoy your walk", "around", "the neighborhood!"],
        realLifeTipEn:
          'Personalize goodbyes with "Enjoy your [walk / meal / afternoon]!" for instant warmth.',
        realLifeTipKo:
          '"Enjoy your walk / meal!"처럼 상대의 다음 일정에 맞춘 끝인사는 원어민들이 가장 좋아하는 표현이에요.',
      },
    ],
  },
];
