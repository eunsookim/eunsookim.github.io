import type { Lang } from "./utils";

const messages = {
  ko: {
    nav: {
      home: "홈",
      blog: "블로그",
      portfolio: "포트폴리오",
      about: "소개",
    },
    hero: {
      tagline: "개발자 김은수",
      heading: "안녕하세요",
      description: "기술에 대한 생각과 의견, 그리고 배움을 기록하는 개발 블로그.",
      blogButton: "Blog 보기",
      portfolioButton: "Portfolio",
    },
    blog: {
      title: "블로그",
      latestPosts: "최근 글",
      viewAll: "모든 글 보기",
      readMore: "더 읽기",
      search: "검색...",
      allCategories: "전체",
      noResults: "게시글이 없습니다.",
      prev: "이전",
      next: "다음",
    },
    portfolio: {
      title: "Portfolio",
      description: "프로젝트 포트폴리오 - 개발한 프로젝트들을 소개합니다.",
      demo: "Demo",
      github: "GitHub",
      noProjects: "프로젝트가 없습니다.",
    },
    about: {
      title: "About",
      description: "안녕하세요, 개발자 김은수입니다.",
      skills: "기술 스택",
      contact: "연락처",
    },
    series: {
      postsInSeries: "시리즈 목록",
    },
    comment: {
      title: "댓글",
      name: "이름",
      password: "비밀번호",
      content: "내용",
      submit: "작성",
      reply: "답글",
      delete: "삭제",
      deleteConfirm: "비밀번호를 입력하세요",
      deleteButton: "삭제",
      cancelButton: "취소",
      noComments: "아직 댓글이 없습니다.",
      replyTo: "답글 작성",
    },
    footer: {
      copyright: "© {year} eunsookim.dev. All rights reserved.",
    },
    lang: {
      toggle: "EN",
    },
  },
  en: {
    nav: {
      home: "Home",
      blog: "Blog",
      portfolio: "Portfolio",
      about: "About",
    },
    hero: {
      tagline: "Developer Eunsoo Kim",
      heading: "Hello",
      description: "A dev blog recording thoughts, opinions, and learnings about technology.",
      blogButton: "View Blog",
      portfolioButton: "Portfolio",
    },
    blog: {
      title: "Blog",
      latestPosts: "Latest Posts",
      viewAll: "View all posts",
      readMore: "Read more",
      search: "Search...",
      allCategories: "All",
      noResults: "No posts found.",
      prev: "Previous",
      next: "Next",
    },
    portfolio: {
      title: "Portfolio",
      description: "Project portfolio - showcasing my development projects.",
      demo: "Demo",
      github: "GitHub",
      noProjects: "No projects yet.",
    },
    about: {
      title: "About",
      description: "Hello, I'm Eunsoo Kim, a developer.",
      skills: "Tech Stack",
      contact: "Contact",
    },
    series: {
      postsInSeries: "Posts in this series",
    },
    comment: {
      title: "Comments",
      name: "Name",
      password: "Password",
      content: "Content",
      submit: "Submit",
      reply: "Reply",
      delete: "Delete",
      deleteConfirm: "Enter your password",
      deleteButton: "Delete",
      cancelButton: "Cancel",
      noComments: "No comments yet.",
      replyTo: "Write a reply",
    },
    footer: {
      copyright: "© {year} eunsookim.dev. All rights reserved.",
    },
    lang: {
      toggle: "KO",
    },
  },
} as const;

export type Messages = (typeof messages)["ko"];

export function getMessages(lang: Lang): (typeof messages)[Lang] {
  return messages[lang];
}
