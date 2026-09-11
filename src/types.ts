/** 한 편(회차)을 이루는 낱장. 뷰어에서 그림 1 + 글 1로 표시된다. */
export interface NovelPage {
  id: string;
  /** 본문. 빈 문자열이면 아직 쓰지 않은 페이지. */
  text: string;
  /**
   * 자동 삽화 재생성용 시드. 같은 글이라도 시드를 바꾸면 다른 그림이 나온다.
   * 작가가 "다시 그리기"를 누를 때마다 증가한다.
   */
  seed: number;
  /** 작가가 자동 분석 결과를 직접 덮어쓴 경우에만 존재한다. */
  sceneOverride?: Partial<SceneOverride>;
}

/** 작가가 손으로 고를 수 있는 장면 요소. 비워두면 본문에서 자동 추론한다. */
export interface SceneOverride {
  place: string;
  time: string;
  weather: string;
  mood: string;
  characters: number;
}

export interface Novel {
  id: string;
  title: string;
  /** 한 줄 소개. 서재 카드와 뷰어 표지에 쓰인다. */
  logline: string;
  author: string;
  pages: NovelPage[];
  createdAt: number;
  updatedAt: number;
}

export type Theme = "light" | "dark";
