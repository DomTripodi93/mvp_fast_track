
import { UserConnectionOption } from "../models/user/user-connection-option.model";
import { UserConnectionService } from './user/user-connection-service.service';
import { UserSettingsService } from './settings/user-settings-service.service';


import { Injectable } from "@angular/core";
import { ErrorService } from './error-service.service';
import { ErrorInfo } from '../models/error-info.model';

@Injectable({ providedIn: 'root' })
export class OptionService {
    optionsAvailable: boolean = false;
    errorInfo: ErrorInfo = this.errorServ.resetErrorMessage();
    optionLists: Record<string, any[]> = {
        "privacyLevels": [
            "Public",
            "Friends Only",
            "Private"
        ],
        "privacyLevelsProfile": [
            "Public",
            "In Community",
            "Friends Only",
            "Private",
            "Hidden"
        ],
        "pronouns": [
            "they/them",
            "she/her",
            "he/him",
            "ze/hir",
            "xe/xem",
            "use my name",
            "ask me",
            "any pronouns are ok"
        ],
        "sexuality": [
            "Prefer not to say",
            "Straight",
            "Gay",
            "Lesbian",
            "Bisexual",
            "Queer",
            "Demisexual",
            "Questioning",
            "Fluid",
            "Pansexual",
            "Polysexual",
            "Omnisexual",
            "Asexual",
            "Graysexual",
            "Other"
        ],
        "religiousGroups": [
            "Prefer not to say",
            "Agnostic",
            "Animist",
            "Athiest",
            "Bahá'í",
            "Buddhist",
            "Christian",
            "Catholic",
            "Confucian",
            "Druze",
            "Hindu",
            "Jain",
            "Jehovah's Witness",
            "Jewish",
            "Mormon",
            "Muslim",
            "Neo-Pagan",
            "Non-Religious",
            "Rastafarian",
            "Scientologist",
            "Shintoist",
            "Sikh",
            "Taoist",
            "Tenrikyo",
            "Unitarian Universalist",
            "Zoroastrian",
            "Other",
            // "Christian",
            // "Muslim",
            // "Jewish",
            // "Hindu",
            // "Buddist",
            // "Sikh",
            // "Jain",
            // "Shintoist",
            // "Taoist",
            // "Other",
        ],
        "policitalParties": [
            "Prefer not to say",
            "Republican",
            "Democratic",
            "Libertarian",
            "Green",
            "Independent",
            "Constitution",
            "Progressive",
            "Socialist",
            "Other",
        ],
        "ethnicityOptions": [
            "Prefer not to say",
            "Arab/Middle Eastern",
            "Black/African/Jamaican",
            "East Asian",
            "Hispanic/Latino",
            "Indian/South Asian",
            "Native American/Indigenous",
            "Pacific Islander",
            "White/Caucasian",
            "Other",
        ],
        "states": [
            "Alabama",
            "Alaska",
            "Arizona",
            "Arkansas",
            "California",
            "Colorado",
            "Connecticut",
            "Delaware",
            "District of Columbia",
            "Florida",
            "Georgia",
            "Hawaii",
            "Idaho",
            "Illinois",
            "Indiana",
            "Iowa",
            "Kansas",
            "Kentucky",
            "Louisiana",
            "Maine",
            "Maryland",
            "Massachusetts",
            "Michigan",
            "Minnesota",
            "Mississippi",
            "Missouri",
            "Montana",
            "Nebraska",
            "Nevada",
            "New Hampshire",
            "New Jersey",
            "New Mexico",
            "New York",
            "North Carolina",
            "North Dakota",
            "Ohio",
            "Oklahoma",
            "Oregon",
            "Pennsylvania",
            "Rhode Island",
            "South Carolina",
            "South Dakota",
            "Tennessee",
            "Texas",
            "Utah",
            "Vermont",
            "Virginia",
            "Washington",
            "West Virginia",
            "Wisconsin",
            "Wyoming",
            "American Samoa",
            "Guam",
            "Northern Mariana Islands",
            "Puerto Rico",
            "U.S. Virgin Islands",
            // "Baker Island",
            // "Howland Island",
            // "Jarvis Island",
            // "Johnston Atoll",
            // "Kingman Reef",
            // "Midway Atoll",
            // "Navassa Island",
            // "Palmyra Atoll",
            // "Wake Island"
        ]
    }

    privacyLevelDescriptions: Record<string, string> = {
        "Public": "Anyone can see this",
        "Friends Only": "Only people I am friends with on Tethee can see this",
        "Private": "Only I can see this",
        "Hidden": "Only people I am friends with on Tethee can see my profile at all\n(My profile will not show up in searches and people cannot send me a friend request)"
    }

    ethnicityDetailedOptions: Record<string, string[]> = {
        "Arab/Middle Eastern": [
            "Prefer not to say",
            "I don't know",
            "Arab",
            "Armenian",
            "Assyrian",
            "Azerbaijani",
            "Berber",
            "Chaldean",
            "Circassian",
            "Druze",
            "Iraqi",
            "Jordanian",
            "Kurd",
            "Lebanese",
            "Palestinian",
            "Persian",
            "Syrian",
            "Yemeni",
            "Other"
        ],
        "Black/African/Jamaican": [
            "Prefer not to say",
            "I don't know",
            "African American",
            "Caribbean",
            "Congolese",
            "Ethiopian",
            "Ghanaian",
            "Haitian",
            "Jamaican",
            "Kenyan",
            "Nigerian",
            "Senegalese",
            "Somali",
            "South African",
            "Sudanese",
            "Zimbabwean",
            "Other"
        ],
        "East Asian": [
            "Prefer not to say",
            "I don't know",
            "Chinese",
            // "Hong Konger",
            "Japanese",
            "Korean",
            "Macanese",
            "Mongolian",
            "Taiwanese",
            "Tibetan",
            "Other"
        ],
        "Hispanic/Latino": [
            "Prefer not to say",
            "I don't know",
            "Argentinian",
            "Bolivian",
            "Chilean",
            "Colombian",
            "Costa Rican",
            "Cuban",
            "Dominican",
            "Ecuadorian",
            "Guatemalan",
            "Honduran",
            "Mexican",
            "Panamanian",
            "Paraguayan",
            "Peruvian",
            "Puerto Rican",
            "Salvadoran",
            "Spaniard",
            "Uruguayan",
            "Venezuelan",
            "Other"
        ],
        "Indian/South Asian": [
            "Prefer not to say",
            "I don't know",
            "Bangladeshi",
            "Bhutanese",
            "Indian",
            "Maldivian",
            "Nepali",
            "Pakistani",
            "Sri Lankan",
            "Other"
        ],
        "Native American/Indigenous": [
            "Prefer not to say",
            "I don't know",
            "Aboriginal Australian",
            "Ainu",
            "First Nations",
            "Inuit",
            "Maori",
            "Métis",
            "Native American",
            "Sami",
            "Other"
        ],
        "Pacific Islander": [
            "Prefer not to say",
            "I don't know",
            "Chamorro",
            "Fijian",
            "Guamanian",
            "Hawaiian",
            "Marshallese",
            "Melanesian",
            "Micronesian",
            "Palauan",
            "Polynesian",
            "Samoan",
            "Tongan",
            "Other"
        ],
        "White/Caucasian": [
            "Prefer not to say",
            "I don't know",
            "Albanian",
            "American",
            "Australian",
            "Austrian",
            "Belgian",
            "Bosnian",
            "Bulgarian",
            "Canadian",
            "Croatian",
            "Czech",
            "Danish",
            "Dutch",
            "English",
            "European",
            "Finnish",
            "French",
            "German",
            "Greek",
            "Hungarian",
            "Icelandic",
            "Irish",
            "Italian",
            "Macedonian",
            "New Zealander",
            "Norwegian",
            "Polish",
            "Portuguese",
            "Romanian",
            "Russian",
            "Scottish",
            "Serbian",
            "Slovak",
            "Slovenian",
            "Spanish",
            "Swedish",
            "Swiss",
            "Ukrainian",
            "Welsh",
            "White",
            "Other"
        ],
        "Other": [
            "Prefer not to say",
            "I don't know",
            "Multiracial",
            "Other"
        ],
        "Prefer not to say": [
            "Prefer not to say"
        ]
    };

    userInfoKeys: string[] = [
        "userId"
    ];

    userConnectionKeys: string[] = [
        "requestUserId",
        "recipientUserId"
    ];

    userSettingsKeys: string[] = [
        "userId"
    ];


    constructor(
        public userConnectionServ: UserConnectionService,
        private errorServ: ErrorService,
    ) { }

    seedAllOptions() {
        Promise.all([
            this.setUserConnectionOptions(),
        ]).then(() => {
            this.optionsAvailable = true;
        })
    }

    subscribeOptionsHaveChanged() {
        this.subscribeUserConnectionOptionsHaveChanged();
    }



    subscribeUserConnectionOptionsHaveChanged() {
        this.userConnectionServ.userConnectionOptionsHaveChanged.subscribe(() => {
            this.setUserConnectionOptions();
        })
    }

    setUserConnectionOptions(
        activeOnly: boolean = true
    ) {
        return new Promise<void>(resolve => {
            this.userConnectionServ.getUserConnectionOptions().subscribe({
                next: (res) => {
                    this.optionLists["userConnection"] = res;
                    resolve();
                    //this.userConnectionOptions = res;
                },
                error: (err: any) => {
                    console.log(err);
                    let errorMessage = "An error occurred while getting the User Connection options. Please try refreshing the page.";
                    this.errorInfo = this.errorServ.getErrorMessage(errorMessage, err.message);
                    resolve();
                }
            });
        })
    }


}
