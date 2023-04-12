
import {
    Injectable,
} from '@nestjs/common';
import {
    strapiFooter,
    strapiHeaderSliders,
    strapiHomeSection2,
    strapiQuestsLists,
    strapiTournamentslists,
    strapiGameLists,
    strapiWikiLists
} from './strapi.dtos';
import axios from 'axios';
import { 
    footerData, 
    headerSlider, 
    homeSection2, 
    questsItems,
    tournamentsLists,
    gameLists,
    mediaLists,
    wikiListsId,
    quest,
    articleDetails,
    videoDetails,
    meta
} from './helpers/transform_data';

@Injectable()
export class StrapiService {
    constructor() { }

    async strapiGetData(url:string, endpoint:string)
    : Promise<
        strapiFooter | 
        strapiHeaderSliders | 
        strapiHomeSection2 | 
        strapiQuestsLists |
        strapiTournamentslists |
        strapiGameLists |
        strapiWikiLists>  {
        const response = await axios.get(url);
        if(endpoint === "footer"){
            return footerData(response);
        } else if (endpoint === "home-sliders"){
            return headerSlider(response);
        } else if (endpoint === "home-section2"){
            return homeSection2(response);
        } else if (endpoint === "quest-lists"){
            return questsItems(response);
        } else if (endpoint === "tournaments-lists"){
            return tournamentsLists(response);
        } else if (endpoint === "game-lists"){
            return gameLists(response);
        } else if (endpoint === "media-lists"){
            return mediaLists(response);
        } else if (endpoint === "wiki-list-id"){
            return wikiListsId(response);
        } else if (endpoint === "quest"){
            return quest(response);
        } else if (endpoint === "article-details"){
            return articleDetails(response);
        } else if (endpoint === "video-details"){
            return videoDetails(response);
        } else if (endpoint === "meta"){
            return meta(response);
        }  else {
            return response.data.data;
        }
    }
}