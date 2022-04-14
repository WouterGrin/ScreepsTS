import { MapInfoController } from "controllers/MapInfoController";
import { RoomInfo } from "types/misc/RoomInfo";

export enum ScreepState{
    IDLE = "idle",
    HAULING = "hauling",
    RETRIEVING = "retrieving",
    HARVESTING = "harvesting",
    UPGRADING = "upgrading",
    BUILDING = "building",
    REPAIRING = "repairing",
    REPAIRING_WALL = "repairing_wall",
    INITIAL_SPAWN = "initial_spawn",
    HAULING_CONTAINER = "hauling_container"
}


export class BaseScreep {
    roomInfo:RoomInfo;
    _screep: Creep;
    public get screep() : Creep {
        return this._screep;
    }
    
    public set screep(v : Creep) {
        this._screep = v;
    }

    public get memory() : CreepMemory {
        return this.screep.memory;
    }
    
    public set memory(v : CreepMemory) {
        this.screep.memory = v;
    }
    
    constructor(screep: Creep) {
        this.screep = screep;
    }

    public prepare(){
        
        if(this.memory.state == null || this.memory.state == undefined){
            this.memory.state = ScreepState.IDLE;
        }
        this.roomInfo = MapInfoController.getRoomScreepInfo(this.screep.memory.origin);
    }

    public update() {
        this.roomInfo = MapInfoController.getRoomScreepInfo(this.screep.memory.origin);
    }

    public changeState(newState: ScreepState){
        if (this.memory.state != newState) {
            this.memory.prevState = this.memory.state;
            this.memory.state = newState;
        }
    }

    public findAvailableSource() : Id<Source> {
        var lowestNr = Number.MAX_SAFE_INTEGER;
        var ret = null;
        for(let sourceId in this.roomInfo.sourceDict) {
            let currSource = this.roomInfo.sourceDict[sourceId];
            
            if (currSource.currentHarvesters < lowestNr){
                lowestNr = currSource.currentHarvesters;
                ret =  currSource.id;
            }
        }
        return ret;
    }
}

export class SourceUserScreep extends BaseScreep {
    public static sourceOccupyWeight: number;

    public get memory() : SourceUserMemory {
        return this.screep.memory as SourceUserMemory;
    }
    
    public set memory(v : SourceUserMemory) {
        this.screep.memory = v;
    }

    public prepare(){
        super.prepare();
    }

    public update() {
        super.update();
    }

}