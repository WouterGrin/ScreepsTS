import { max } from "lodash";
import { RoomInfo } from "./RoomInfo";

export class SpawnPriority {
    role: string;
    body: BodyPartConstant[];

    getWeight(game: Game, roomInfo: RoomInfo) : number{
        return 0;
    };

    getMax() : number {
        return 0;
    };

    getBodyPart(roomInfo: RoomInfo) : BodyPartConstant[]{
        return this.body;
    }

    amountOfStaticHarvestingSpots(roomInfo: RoomInfo) : number{
        var spots = 0;
        if (roomInfo.structureDict["container"].length > 0) {
            roomInfo.structureDict["container"].forEach(currentContainer => {
                for (const sourceInfoKey in roomInfo.sourceDict) {
                    var source = Game.getObjectById(roomInfo.sourceDict[sourceInfoKey].id);
                    var isInRangeForStaticHarvesting = currentContainer.pos.inRangeTo(source.pos.x, source.pos.y, 2);
                    if (isInRangeForStaticHarvesting) {
                        spots++;
                    }
                }

            });
        }
        return spots;
    }
}