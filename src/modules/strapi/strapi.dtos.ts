
export class strapiFooter {
    email: string;
    userId: string;
    discord: string;
    twitter: string;
    youtube: string;
    instagram: string;
    substack: string;
    header: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    rights_reserved_text1: string;
    rights_reserved_text2: string;
}


export class strapiHeaderSliders {
    id: number;
    attributes: {
      header: string;
      description: string;
      cta: string;
      link: string;
      createdAt: string;
      updatedAt: string;
      publishedAt: string;
      list_priority: string
      image: {
        large: string;
        medium: string;
        small: string;
      }
    }
}[];

export class strapiHomeSection2 {
    header1: string;
    header2: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    icon1_header: string;
    icon1_description: string;
    icon2_description: string;
    icon3_description: string;
    icon2_header: string;
    icon3_header: string;
    icon1: string;
    icon2: string;
    icon3: string;
}

export class strapiQuestsLists {
    id: number;
    attributes: {
      list_priority: string;
      quest_id: string;
      game_title: string;
      game_description: string;
      reward: string;
      start: string;
      end: string;
      createdAt: string;
      updatedAt: string;
      publishedAt: string;
      youtube: string;
      cta_link: string;
      cta_button_text: string;
      icon: string;
    }
}[]

export class strapiTournamentslists {
    id: number;
    attributes: {
      list_priority: string;
      game_title: string;
      start: string;
      reward: string;
      tag: string;
      createdAt: string;
      updatedAt: string;
      publishedAt: string;
      video: string | null;
      mute: boolean;
      icon: string | null;
    }
}[]

export class strapiGameLists {
    id: number
    attributes: {
      list_priority: string;
      name: string;
      video: string;
      website: string;
      dev_name: string;
      live_upcoming: string;
      cta: string | null;
      genre: string;
      priority: string;
      cta_button_text: string;
      createdAt: string;
      updatedAt: string;
      publishedAt: string;
      mute: boolean;
      icon: string;
    }
}[]

export class strapiWikiLists {
    id: number;
    attributes: {
      list_priority: string;
      header: string;
      category: string;
      video: string | null;
      createdAt: string;
      updatedAt: string;
      publishedAt: string;
      hashTags: string;
      image: string | null;
    }
}[]


