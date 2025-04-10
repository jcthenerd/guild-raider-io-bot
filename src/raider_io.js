import { AsciiTable3 } from "ascii-table3";
import 'dotenv/config';

const guildUrl = `https://raider.io/api/v1/guilds/profile?region=us&realm=nerzhul&name=trade%20union&fields=members&access_key=${process.env.RAIDER_IO_KEY}`;
const seasonSlug = 'season-tww-2';

export async function getGuildList() {
    const res = await fetch(guildUrl);
    // throw API errors
    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    const body = await res.json();

    const memberRatings = await getAllMemberRatings(body.members);

    const table = new AsciiTable3('Guild Rankings (Top 20)')
        .setHeading('Guild Rank', 'Character Name', 'Mythic+ Score', 'Class/Role Region Rating')      
        .addRowMatrix(memberRatings);
    return '```\n' + table.toString() + '```';
}

async function getAllMemberRatings(members) {
    const characters = await Promise.all(members.map(async (member) => {
        return await getMemberRating(member.character);
    }));
    
    const filtered = characters
        .filter(character => character.mythic_plus_ranks.overall.world !== 0)
        .sort((a, b) => b.mythic_plus_scores_by_season[0].scores.all - a.mythic_plus_scores_by_season[0].scores.all)
        .map((character, index) => buildCharacterArray(character, index))
        .slice(0, 20);
    
    return filtered;
}

function formatCharacter(character, index) {
    return `${index + 1} - ${character.name} - ${character.mythic_plus_scores_by_season[0].scores.all} - ${getActiveSpecRank(character)}`;
}

function buildCharacterArray(character, index) {
    return [
        `${index + 1}`, 
        `${character.name}`, 
        `${character.mythic_plus_scores_by_season[0].scores.all}`, 
        `${getActiveSpecRank(character)}`
    ];
}

function getActiveSpecRank(character) {
    var role;

    switch(character.active_spec_role) {
        case 'HEALING':
            role = 'healer';
            break;
        case 'DPS':
            role = 'dps';
            break;
        case 'TANK':
            role = 'tank';
            break;
    }

    return character.mythic_plus_ranks[`class_${role}`].region;
}

async function getMemberRating(character) {
    const {name, realm} = character
    
    return await fetchCharacterInfo(name, realm);
}

export async function getCharacterData(characterName, realm) {
    console.log("Entering call to raider io");
    const character = await fetchCharacterInfo(characterName, realm);
    console.log("Returned from raider io call");

    const characterInfoBody = [
        [`Character Name`, `${character.name}`], 
        [`Mythic+ Rating`, `${character.mythic_plus_scores_by_season[0].scores.all}`], 
        [`Class`, `${character.class}`],
        [`Active Spec`, `${character.active_spec_name}`],
        [`Active Spec Role`, `${character.active_spec_role}`],
        [`Active Spec Region Rank`, `${getActiveSpecRank(character)}`]
    ];

    console.log("Building table");
    const table = new AsciiTable3('Character Info')
        .addRowMatrix(characterInfoBody);
    return '```\n' + table.toString() + '```';

};

async function fetchCharacterInfo(characterName, realm) {
    const realmSlug = realm.replace(' ', '-').replace("'", '');

    const characterUrl = `https://raider.io/api/v1/characters/profile?region=us&realm=${realmSlug}&name=${characterName}&fields=mythic_plus_ranks,mythic_plus_scores_by_season:${seasonSlug}&access_key=${process.env.RAIDER_IO_KEY}`;
    const res = await fetch(characterUrl);

    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    const body = await res.json();
    
    return body;
}