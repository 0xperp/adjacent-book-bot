class OddsAPI {
  private apiUrl: string;
  private apiKey: string;
  private sports: string[]

  constructor(endpoint: string = 'https://api.the-odds-api.com/v4/', apiKey: string) {
    this.apiUrl = endpoint;
    this.apiKey = apiKey;
    this.sports = [
        "americanfootball_cfl",
        "americanfootball_ncaaf",
        "americanfootball_ncaaf_championship_winner",
        "americanfootball_nfl",
        "americanfootball_nfl_super_bowl_winner",
        "americanfootball_xfl",
        "aussierules_afl",
        "baseball_mlb",
        "baseball_mlb_preseason",
        "baseball_mlb_world_series_winner",
        "baseball_ncaa",
        "basketball_euroleague",
        "basketball_nba",
        "basketball_nba_championship_winner",
        "basketball_wnba",
        "basketball_ncaab",
        "basketball_ncaab_championship_winner",
        "boxing_boxing",
        "cricket_big_bash",
        "cricket_caribbean_premier_league",
        "cricket_icc_world_cup",
        "cricket_international_t20",
        "cricket_ipl",
        "cricket_odi",
        "cricket_psl",
        "cricket_t20_blast",
        "cricket_test_match",
        "golf_masters_tournament_winner",
        "golf_pga_championship_winner",
        "golf_the_open_championship_winner",
        "golf_us_open_winner",
        "icehockey_nhl",
        "icehockey_nhl_championship_winner",
        "icehockey_sweden_hockey_league",
        "icehockey_sweden_allsvenskan",
        "mma_mixed_martial_arts",
        "politics_us_presidential_election_winner",
        "rugbyleague_nrl",
        "soccer_africa_cup_of_nations",
        "soccer_argentina_primera_division",
        "soccer_australia_aleague",
        "soccer_austria_bundesliga",
        "soccer_belgium_first_div",
        "soccer_brazil_campeonato",
        "soccer_brazil_serie_b",
        "soccer_chile_campeonato",
        "soccer_china_superleague",
        "soccer_denmark_superliga",
        "soccer_efl_champ",
        "soccer_england_efl_cup",
        "soccer_england_league1",
        "soccer_england_league2",
        "soccer_epl",
        "soccer_fa_cup",
        "soccer_fifa_world_cup",
        "soccer_fifa_world_cup_womens",
        "soccer_finland_veikkausliiga",
        "soccer_france_ligue_one",
        "soccer_france_ligue_two",
        "soccer_germany_bundesliga",
        "soccer_germany_bundesliga2",
        "soccer_germany_liga3",
        "soccer_greece_super_league",
        "soccer_italy_serie_a",
        "soccer_italy_serie_b",
        "soccer_japan_j_league",
        "soccer_korea_kleague1",
        "soccer_league_of_ireland",
        "soccer_mexico_ligamx",
        "soccer_netherlands_eredivisie",
        "soccer_norway_eliteserien",
        "soccer_poland_ekstraklasa",
        "soccer_portugal_primeira_liga",
        "soccer_spain_la_liga",
        "soccer_spain_segunda_division",
        "soccer_spl",
        "soccer_sweden_allsvenskan",
        "soccer_sweden_superettan",
        "soccer_switzerland_superleague",
        "soccer_turkey_super_league",
        "soccer_uefa_europa_conference_league",
        "soccer_uefa_champs_league",
        "soccer_uefa_champs_league_qualification",
        "soccer_uefa_europa_league",
        "tennis_atp_aus_open_singles",
        "tennis_atp_french_open",
        "tennis_atp_us_open",
        "tennis_atp_wimbledon",
        "tennis_wta_aus_open_singles",
        "tennis_wta_french_open",
        "tennis_wta_us_open",
        "tennis_wta_wimbledon"
      ];
      
  }

  public async getSports(): Promise<any> {
    const url = `${this.apiUrl}/sports?apiKey=${this.apiKey}`;
    let response = await fetch(url).then(response => response.json());
    return response;
  }

  public async getOdds(): Promise<any> {
    const url = `${this.apiUrl}/odds?apiKey=${this.apiKey}`;
    let response = await fetch(url).then(response => response.json());
    return response;
  }

  public async getScores(): Promise<any> {
    const url = `${this.apiUrl}/scores?apiKey=${this.apiKey}`;
    let response = await fetch(url).then(response => response.json());
    return response;
  }

  public async getEvents(sport: String): Promise<any> {
    const url = `${this.apiUrl}/sports/${sport}/events?apiKey=${this.apiKey}`;
    let response = await fetch(url).then(response => response.json());
    return response;
  }

  public async getEventsOdds(sport: String, eventId: String): Promise<any> {
    const url = `${this.apiUrl}/sports/${sport}events/${eventId}/odds?apiKey=${this.apiKey}&regions=us&dateFormat=iso&oddsFormat=decimal`;
    let response = await fetch(url).then(response => response);
    return response;
  }
}

export default OddsAPI;