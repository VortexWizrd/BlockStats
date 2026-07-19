import type { leaderboardsTable, mapsTable } from "../db/schema.js";
import beatleaderApiService from "./external/beatleader-api.service.js";
import scoresaberApiService from "./external/scoresaber-api.service.js";
import Map from "../common/map/map.js";
import { MapsRepository } from "../repositories/maps/maps.repository.js";
import { LeaderboardsRepository } from "../repositories/maps/leaderboards.repository.js";
import type Leaderboard from "../common/map/leaderboard.js";
import accsaberApiService from "./external/accsaber-api.service.js";
import beatsaverApiService from "./external/beatsaver-api.service.js";

type MapInsert = typeof mapsTable.$inferInsert;
type LeaderboardInsert = typeof leaderboardsTable.$inferInsert;
type FullMap = {
  map: Map;
  leaderboards: Leaderboard[];
};
export class MapService {
  public static async createMap(map: Map): Promise<Map | undefined> {
    try {
      const { id, ...newMap } = map;

      const mapInsert = await MapsRepository.insert(newMap as MapInsert);
      console.log(
        `[LOG]: MapService: Created new map for "${mapInsert.songName}" (hash: ${mapInsert.hash})`,
      );
      return mapInsert as Map;
    } catch (err) {
      console.log("Error creating map: ", err);
      return undefined;
    }
  }

  public static async createLeaderboard(
    leaderboard: Leaderboard,
  ): Promise<Leaderboard | undefined> {
    try {
      const { id, ...newLeaderboard } = leaderboard;

      // Check if map exists
      const map = await MapsRepository.findById(leaderboard.mapId);
      if (!map) {
        console.error(
          `[ERROR]: MapService: Attempted to create leaderboard for map ${leaderboard.mapId}, which does not exist`,
        );
        return undefined;
      }

      const leaderboardInsert = await LeaderboardsRepository.insert(
        newLeaderboard as LeaderboardInsert,
      );

      console.log(
        `[LOG]: MapService: Created new ${leaderboard.difficulty} leaderboard for "${map.songName}"`,
      );
      return leaderboardInsert as Leaderboard;
    } catch (err) {
      console.log("Error creating map: ", err);
      return undefined;
    }
  }

  public static async getMap(id: number): Promise<Map | undefined> {
    return (await MapsRepository.findById(id)) as Map;
  }

  public static async getMapFromBeatSaverId(
    id: string,
  ): Promise<Map[] | undefined> {
    return (await MapsRepository.findByBeatSaverId(id)) as Map[];
  }

  public static async getMapFromHash(hash: string): Promise<Map | undefined> {
    return (await MapsRepository.findByHash(hash)) as Map;
  }

  public static async getLeaderboard(
    id: number,
  ): Promise<Leaderboard | undefined> {
    return (await LeaderboardsRepository.findById(id)) as Leaderboard;
  }

  public static async getLeaderboardFromBeatLeader(
    id: number,
  ): Promise<Leaderboard | undefined> {
    return (await LeaderboardsRepository.findByBeatLeaderId(id)) as Leaderboard;
  }

  public static async getLeaderboardFromScoreSaber(
    id: number,
  ): Promise<Leaderboard | undefined> {
    return (await LeaderboardsRepository.findByScoreSaberId(id)) as Leaderboard;
  }

  public static async addLeaderboardId(id: number, leaderboardId: number) {
    return await MapsRepository.addLeaderboardId(id, leaderboardId);
  }

  public static async getLeaderboardFromMap(
    mapId: number,
    difficulty: string,
    characteristic: string,
  ): Promise<Leaderboard | undefined> {
    return (await LeaderboardsRepository.findOneFromMap(
      mapId,
      difficulty,
      characteristic,
    )) as Leaderboard;
  }

  public static async getLeaderboardsFromMap(
    mapId: number,
  ): Promise<Leaderboard[] | undefined> {
    return (await LeaderboardsRepository.findFromMap(mapId)) as Leaderboard[];
  }

  public static async createFromScoreSaber(
    hash: string,
    overwrite: boolean,
  ): Promise<FullMap | undefined> {
    // check if map exists and create if it doesnt
    let map = await this.getMapFromHash(hash.toLowerCase());
    if (map && !overwrite) return undefined;
    const scoreSaberMap = await scoresaberApiService.getMapFromHash(
      hash.toUpperCase(),
    );
    const beatSaverMap = await beatsaverApiService.getMapFromHash(
      hash.toUpperCase(),
    );
    if (!scoreSaberMap) {
      console.error(
        `[ERROR]: MapService: Failed to create map from ScoreSaber with hash ${hash}: ScoreSaber returned ${scoreSaberMap}`,
      );
      return undefined;
    }
    if (!beatSaverMap) {
      console.error(
        `[ERROR]: MapService: Failed to create map from ScoreSaber with hash ${hash}: BeatSaver returned ${beatSaverMap.toString()}`,
      );
      return undefined;
    }
    if (!map) {
      map = await this.createMap({
        id: -1,
        hash: hash.toLowerCase(),
        songName: scoreSaberMap.songName,
        songSubName: scoreSaberMap.songSubName,
        songAuthor: scoreSaberMap.songAuthorName,
        mapAuthor: scoreSaberMap.levelAuthorName,
        songCover: scoreSaberMap.coverUrl,
        leaderboardIds: [],
        savedTime: new Date(),
        updatedTime: new Date(),
        beatSaverId: scoreSaberMap.bsid ?? null,
        songDescription: beatSaverMap.description ?? "",
        songDuration: beatSaverMap.metadata.duration ?? null,
        songBPM: beatSaverMap.metadata.bpm ?? null,
        uploadedTime: beatSaverMap?.lastPublishedAt
          ? new Date(beatSaverMap.lastPublishedAt)
          : null,
      });
      if (!map) {
        console.error(
          `[ERROR]: MapService: Failed to create map from ScoreSaber with hash ${hash}: Map failed to be found or created on DB`,
        );
        return undefined;
      }
    } else {
      await MapsRepository.update(map.id, {
        hash: hash.toLowerCase(),
        songName: scoreSaberMap.songName,
        songSubName: scoreSaberMap.songSubName,
        songAuthor: scoreSaberMap.songAuthorName,
        mapAuthor: scoreSaberMap.levelAuthorName,
        songCover: scoreSaberMap.coverUrl,
        updatedTime: new Date(),
        beatSaverId: scoreSaberMap.bsid ?? null,
        songDescription: beatSaverMap.description ?? "",
        songDuration: beatSaverMap.metadata.duration ?? null,
        songBPM: beatSaverMap.metadata.bpm ?? null,
        uploadedTime: beatSaverMap?.lastPublishedAt
          ? new Date(beatSaverMap.lastPublishedAt)
          : null,
      });
    }

    let leaderboards: Leaderboard[] = [];

    // create leaderboards
    for (const ssLeaderboard of scoreSaberMap.leaderboards) {
      let difficulty = ssLeaderboard.rawDifficulty
        .replace(/^_+/, "")
        .split("_")[0];
      if (difficulty == "ExpertPlus") difficulty = "Expert+";
      const characteristic = ssLeaderboard.gameMode.replace("Solo", "");
      const existingLeaderboard = await this.getLeaderboardFromMap(
        map.id,
        difficulty,
        characteristic,
      );
      if (existingLeaderboard) {
        const updateData = {
          ssLeaderboardId: ssLeaderboard.id,
          ssRankedStatus: ssLeaderboard.realm.leaderboardStatus,
          ssStarRating: ssLeaderboard.realm.stars,
          updatedTime: new Date(),
        };
        const newLeaderboard = await LeaderboardsRepository.update(
          existingLeaderboard.id,
          updateData,
        );
        leaderboards.push(newLeaderboard);

        continue;
      }
      const newLeaderboard = await this.createLeaderboard({
        id: -1,
        savedTime: new Date(),
        updatedTime: new Date(),
        mapId: map.id,
        difficulty: difficulty,
        characteristic: characteristic,
        blLeaderboardId: null,
        blRankedStatus: null,
        blStarRating: null,
        blTechRating: null,
        blAccRating: null,
        blPassRating: null,
        ssLeaderboardId: ssLeaderboard.id,
        ssRankedStatus: ssLeaderboard.realm.leaderboardStatus,
        ssStarRating: ssLeaderboard.realm.stars,
        asLeaderboardId: null,
        asRankedStatus: null,
        asCategoryId: null,
        asCategoryCode: null,
        asComplexity: null,
      });
      if (!newLeaderboard) {
        continue;
      }
      leaderboards.push(newLeaderboard);
      await this.addLeaderboardId(map.id, newLeaderboard.id);
    }
    return {
      map: map,
      leaderboards: leaderboards,
    };
  }

  public static async createFromBeatLeader(
    beatSaverId: string,
    overwrite: boolean,
  ): Promise<FullMap | undefined> {
    const leaderboard =
      await beatleaderApiService.getMapFromBeatSaverId(beatSaverId);
    const beatSaverMap = await beatsaverApiService.getMapFromId(beatSaverId);
    if (!leaderboard) {
      console.error(
        `[ERROR]: MapService: Failed to create map from BeatLeader with BeatSaver ID ${beatSaverId}: BeatLeader returned ${leaderboard}`,
      );
      return undefined;
    }
    if (!beatSaverMap) {
      console.warn(
        `[WARN]: MapService: Failed to fetch BeatSaver map ${beatSaverId}: BeatSaver returned ${leaderboard}`,
      );
    }

    let map = await this.getMapFromHash(leaderboard.song.hash);
    if (map && !overwrite) return undefined;
    if (!map) {
      map = await this.createMap({
        id: -1,
        hash: leaderboard.song.hash.toLowerCase(),
        songName: leaderboard.song.name,
        songSubName: leaderboard.song.subName,
        songAuthor: leaderboard.song.author,
        mapAuthor: leaderboard.song.mapper,
        songCover: leaderboard.song.coverImage,
        leaderboardIds: [],
        savedTime: new Date(),
        updatedTime: new Date(),
        beatSaverId: beatSaverMap?.id ?? null,
        songDescription: beatSaverMap?.description ?? "",
        songDuration: beatSaverMap?.metadata.duration ?? null,
        songBPM: beatSaverMap?.metadata.bpm ?? null,
        uploadedTime: beatSaverMap?.lastPublishedAt
          ? new Date(beatSaverMap.lastPublishedAt)
          : null,
      });
      if (!map) {
        console.error(
          `[ERROR]: MapService: Failed to create map from BeatLeader with hash ${leaderboard.song.hash}: Map failed to be found or created on DB`,
        );
        return undefined;
      }
    } else {
      await MapsRepository.update(map.id, {
        hash: leaderboard.song.hash.toLowerCase(),
        songName: leaderboard.song.name,
        songSubName: leaderboard.song.subName,
        songAuthor: leaderboard.song.author,
        mapAuthor: leaderboard.song.mapper,
        songCover: leaderboard.song.coverImage,
        updatedTime: new Date(),
        beatSaverId: beatSaverMap?.id ?? null,
        songDescription: beatSaverMap?.description ?? "",
        songDuration: beatSaverMap?.metadata.duration ?? null,
        songBPM: beatSaverMap?.metadata.bpm ?? null,
        uploadedTime: beatSaverMap?.lastPublishedAt
          ? new Date(beatSaverMap.lastPublishedAt)
          : null,
      });
    }

    for (const diff of leaderboard.song.difficulties) {
      let difficulty = diff.difficultyName;
      if (difficulty == "ExpertPlus") difficulty = "Expert+";
      const characteristic = diff.modeName;
      const existingLeaderboard = await this.getLeaderboardFromMap(
        map.id,
        difficulty,
        characteristic,
      );
      if (existingLeaderboard) {
        const updateData = {
          blLeaderboardId:
            diff.songId.toString() +
            diff.value.toString() +
            diff.mode.toString(),
          blRankedStatus: diff.status.toString(), // what does this even mean why is it a number
          blStarRating: diff.stars,
          blTechRating: diff.techRating,
          blAccRating: diff.accRating,
          blPassRating: diff.passRating,
          updatedTime: new Date(),
        };
        await LeaderboardsRepository.update(existingLeaderboard.id, updateData);
        continue;
      }
      const newLeaderboard = await this.createLeaderboard({
        id: -1,
        savedTime: new Date(),
        updatedTime: new Date(),
        mapId: map.id,
        difficulty: difficulty,
        characteristic: characteristic,
        blLeaderboardId:
          diff.songId.toString() + diff.value.toString() + diff.mode.toString(),
        blRankedStatus: diff.status.toString(),
        blStarRating: diff.stars,
        blTechRating: diff.techRating,
        blAccRating: diff.accRating,
        blPassRating: diff.passRating,
        ssLeaderboardId: null,
        ssRankedStatus: null,
        ssStarRating: null,
        asLeaderboardId: null,
        asRankedStatus: null,
        asCategoryId: null,
        asCategoryCode: null,
        asComplexity: null,
      });
      if (!newLeaderboard) {
        continue;
      }
      await this.addLeaderboardId(map.id, newLeaderboard.id);
    }
  }

  public static async createFromAccSaber(
    hash: string,
    overwrite: boolean,
  ): Promise<FullMap | undefined> {
    // check if map exists and create if it doesnt
    let map = await this.getMapFromHash(hash.toLowerCase());
    if (map && !overwrite) return undefined;
    const accSaberMap = await accsaberApiService.getMapFromHash(
      hash.toLowerCase(),
    );
    if (!accSaberMap) {
      console.error(
        `[ERROR]: MapService: Failed to create map from AccSaber with hash ${hash}: AccSaber returned ${accSaberMap}`,
      );
      return undefined;
    }
    if (!map) {
      map = await this.createMap({
        id: -1,
        hash: hash.toLowerCase(),
        songName: accSaberMap.songName ?? "",
        songSubName: accSaberMap.songSubName ?? "",
        songAuthor: accSaberMap.songAuthor ?? "",
        mapAuthor: accSaberMap.mapAuthor ?? "",
        songCover: accSaberMap.coverUrl ?? "",
        leaderboardIds: [],
        savedTime: new Date(),
        updatedTime: new Date(),
        beatSaverId: accSaberMap.beatsaverCode ?? null,
        songDescription: "",
        songDuration: null,
        songBPM: null,
        uploadedTime: null,
      });
      if (!map) {
        console.error(
          `[ERROR]: MapService: Failed to create map from AccSaber with hash ${hash}: Map failed to be found or created on DB`,
        );
        return undefined;
      }
    }

    // create leaderboards
    for (const leaderboard of accSaberMap.difficulties) {
      const difficulty =
        leaderboard.difficulty == "EXPERT_PLUS"
          ? "Expert+"
          : leaderboard.difficulty.charAt(0).toUpperCase() +
            leaderboard.difficulty.slice(1).toLowerCase();

      const characteristic = leaderboard.characteristic;
      const existingLeaderboard = await this.getLeaderboardFromMap(
        map.id,
        difficulty,
        characteristic,
      );
      if (existingLeaderboard) {
        const updateData = {
          blLeaderboardId: leaderboard.blLeaderboardId,
          ssLeaderboardId: leaderboard.ssLeaderboardId,
          asLeaderboardId: leaderboard.id,
          asRankedStatus: leaderboard.status,
          asCategoryId: leaderboard.categoryId,
          asCategoryCode: accsaberApiService.getCategoryCodeFromId(
            leaderboard.categoryId,
          ),
          asComplexity: leaderboard.complexity,
          updatedTime: new Date(),
        };
        await LeaderboardsRepository.update(existingLeaderboard.id, updateData);
        continue;
      }
      const newLeaderboard = await this.createLeaderboard({
        id: -1,
        savedTime: new Date(),
        updatedTime: new Date(),
        mapId: map.id,
        difficulty: difficulty,
        characteristic: characteristic,
        blLeaderboardId: leaderboard.blLeaderboardId,
        blRankedStatus: null,
        blStarRating: null,
        blTechRating: null,
        blAccRating: null,
        blPassRating: null,
        ssLeaderboardId: leaderboard.ssLeaderboardId,
        ssRankedStatus: null,
        ssStarRating: null,
        asLeaderboardId: leaderboard.id,
        asRankedStatus: leaderboard.status,
        asCategoryId: leaderboard.categoryId,
        asCategoryCode: accsaberApiService.getCategoryCodeFromId(
          leaderboard.categoryId,
        ),
        asComplexity: leaderboard.complexity,
      });
      if (!newLeaderboard) {
        continue;
      }
      await this.addLeaderboardId(map.id, newLeaderboard.id);
    }
  }

  public static async createAccSaberRankedMaps() {
    const accSaberMaps = await accsaberApiService.getRankedMaps();
    for (const accSaberMapSimple of accSaberMaps) {
      const accSaberMap = await accsaberApiService.getMapFromId(
        accSaberMapSimple.mapId,
      ); // why include everything but the map hash whyyyyy now i gotta do this dumb thing
      let map = await this.getMapFromHash(accSaberMap.songHash.toLowerCase());
      if (!map) {
        map = await this.createMap({
          id: -1,
          hash: accSaberMap.songHash.toLowerCase(),
          songName: accSaberMap.songName ?? "",
          songSubName: accSaberMap.songSubName ?? "",
          songAuthor: accSaberMap.songAuthor ?? "",
          mapAuthor: accSaberMap.mapAuthor ?? "",
          songCover: accSaberMap.coverUrl ?? "",
          leaderboardIds: [],
          savedTime: new Date(),
          updatedTime: new Date(),
          beatSaverId: accSaberMap.beatsaverCode ?? null,
          songDescription: "",
          songDuration: null,
          songBPM: null,
          uploadedTime: null,
        });
        if (!map) {
          console.error(
            `[ERROR]: MapService: Failed to create map from AccSaber with hash ${accSaberMap.hash}: Map failed to be found or created on DB`,
          );
          return undefined;
        }
      }

      // create leaderboards
      for (const leaderboard of accSaberMap.difficulties) {
        const difficulty =
          leaderboard.difficulty == "EXPERT_PLUS"
            ? "Expert+"
            : leaderboard.difficulty.charAt(0).toUpperCase() +
              leaderboard.difficulty.slice(1).toLowerCase();

        const characteristic = leaderboard.characteristic;
        const existingLeaderboard = await this.getLeaderboardFromMap(
          map.id,
          difficulty,
          characteristic,
        );
        if (existingLeaderboard) {
          const updateData = {
            blLeaderboardId: leaderboard.blLeaderboardId,
            ssLeaderboardId: leaderboard.ssLeaderboardId,
            asLeaderboardId: leaderboard.id,
            asRankedStatus: leaderboard.status,
            asCategoryId: leaderboard.categoryId,
            asCategoryCode: accsaberApiService.getCategoryCodeFromId(
              leaderboard.categoryId,
            ),
            asComplexity: leaderboard.complexity,
            updatedTime: new Date(),
          };
          await LeaderboardsRepository.update(
            existingLeaderboard.id,
            updateData,
          );
          continue;
        }
        const newLeaderboard = await this.createLeaderboard({
          id: -1,
          savedTime: new Date(),
          updatedTime: new Date(),
          mapId: map.id,
          difficulty: difficulty,
          characteristic: characteristic,
          blLeaderboardId: leaderboard.blLeaderboardId,
          blRankedStatus: null,
          blStarRating: null,
          blTechRating: null,
          blAccRating: null,
          blPassRating: null,
          ssLeaderboardId: leaderboard.ssLeaderboardId,
          ssRankedStatus: null,
          ssStarRating: null,
          asLeaderboardId: leaderboard.id,
          asRankedStatus: leaderboard.status,
          asCategoryId: leaderboard.categoryId,
          asCategoryCode: accsaberApiService.getCategoryCodeFromId(
            leaderboard.categoryId,
          ),
          asComplexity: leaderboard.complexity,
        });
        if (!newLeaderboard) {
          continue;
        }
        await this.addLeaderboardId(map.id, newLeaderboard.id);
      }
    }
  }
}
