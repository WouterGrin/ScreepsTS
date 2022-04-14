import { ScreepState } from "$creeps/BaseScreep";
import _, { List } from "lodash";
import { RoomInfo } from "types/misc/RoomInfo";
import { SpawnPriority } from "types/misc/SpawnPriority";
import { MapInfoController } from "./MapInfoController";


export class BuilderPriority extends SpawnPriority{
    role = "Builder";
    _max:number;
    constructor(max: number) {
        super();
        this._max = max;
        this.body = [WORK, CARRY, MOVE];
    }

    getBodyPart(roomInfo: RoomInfo) : BodyPartConstant[]{
        var newBodyPart = [WORK, CARRY, MOVE];
        var cap = 0;
        if (MapInfoController.economyGrowth(roomInfo.name) > Game.rooms[roomInfo.name].energyCapacityAvailable / 2) {
            cap = Math.max(Game.rooms[roomInfo.name].energyCapacityAvailable - 200, 400);
        }else if (MapInfoController.economyGrowth(roomInfo.name) > Game.rooms[roomInfo.name].energyCapacityAvailable / 3) {
            cap = Math.max(Game.rooms[roomInfo.name].energyCapacityAvailable - 200, 200);
        }
        while (cap > 200) {
            newBodyPart.push(WORK, CARRY, MOVE);
            cap -= 200;
        }
        return newBodyPart;
    }

    getWeight(game: Game, roomInfo: RoomInfo) : number{
        if( roomInfo.screepRoles[this.role] >= this.getMax()){
            return 0;
        }
        return 1;
    }

    getMax(){
        return this._max;
    }
}

export class UpgraderPriority extends SpawnPriority{
    role = "Upgrader";
    _max:number;
    constructor(max: number) {
        super();
        this._max = max;
        this.body = [WORK, CARRY, MOVE];
    }

    getBodyPart(roomInfo: RoomInfo) : BodyPartConstant[]{
        var newBodyPart = [WORK, CARRY, MOVE];
        var cap = 0;

        if (SpawnController.areAllCreepsSpawned(roomInfo.name), [this.role]){
            cap = Math.max(Game.rooms[roomInfo.name].energyCapacityAvailable - 200, 600);
        }else if (MapInfoController.economyGrowth(roomInfo.name) > Game.rooms[roomInfo.name].energyCapacityAvailable / 2) {
            cap = Math.max(Game.rooms[roomInfo.name].energyCapacityAvailable - 200, 400);
        }else if (MapInfoController.economyGrowth(roomInfo.name) > Game.rooms[roomInfo.name].energyCapacityAvailable / 3) {
            cap = Math.max(Game.rooms[roomInfo.name].energyCapacityAvailable - 200, 200);
        }


        while (cap > 200) {
            newBodyPart.push(WORK, CARRY, MOVE);
            cap -= 200;
        }
        return newBodyPart;
    }
   
    getWeight(game: Game, roomInfo: RoomInfo) : number{
        if(roomInfo.screepRoles[this.role] >= this.getMax()){
            return 0;
        }
        var amountOfStaticHarvestPlaces = this.amountOfStaticHarvestingSpots(roomInfo);
        if (amountOfStaticHarvestPlaces > 0 && (roomInfo.getRoleAmount("StaticHarvester") == 0 || roomInfo.getRoleAmount("Hauler") == 0 || roomInfo.getRoleAmount("Redistributor") == 0)) {
            return 0;
        }
        return 1;
    }
    
    getMax(){
        return this._max;
    }
}

export class HarvesterRunnerPriority extends SpawnPriority{
    role = "HarvesterRunner";
    _max:number;
    constructor(max: number) {
        super();
        this._max = max;
        this.body = [WORK, CARRY, MOVE];
    }

    getWeight(game: Game, roomInfo: RoomInfo) : number{
        var amountOfStaticHarvestPlaces = this.amountOfStaticHarvestingSpots(roomInfo);
        if (amountOfStaticHarvestPlaces > 0) {
            return 0;
        }
        if (roomInfo.getRoleAmount(this.role) <= 1){
            return Number.MAX_SAFE_INTEGER;
        }

        if(roomInfo.getRoleAmount(this.role) >= this.getMax()){
            return 0;
        }

        return 1 + ((this.getMax()+1) / (roomInfo.getRoleAmount(this.role)+1));
    }

    
    getMax(){
        return this._max;
    }
}


export class StaticHarvesterPriority extends SpawnPriority{
    role = "StaticHarvester";
    _max:number;
    constructor() {
        super();
        this.body = [WORK, CARRY, MOVE];
    }

    getBodyPart(roomInfo: RoomInfo) : BodyPartConstant[]{
        var newBodyPart = [WORK, CARRY, MOVE];
        var cap = Math.max(Game.rooms[roomInfo.name].energyCapacityAvailable - 200, 400);
        var amountWorkParts = Math.floor(cap / BODYPART_COST["work"]);
        for (let i = 0; i < amountWorkParts; i++) {
            newBodyPart.push(WORK);
        }
        return newBodyPart;
    }

    getWeight(game: Game, roomInfo: RoomInfo) : number{
        var amountOfStaticHarvestPlaces = this.amountOfStaticHarvestingSpots(roomInfo);
        if (roomInfo.getRoleAmount(this.role) >= amountOfStaticHarvestPlaces) {
            return 0;
        }
        if (amountOfStaticHarvestPlaces > 0) {
            var weight = 1 + (3 / (roomInfo.getRoleAmount(this.role)+1));
            return weight;
        }
        return 0;
    }

    
    getMax(){
        return this._max;
    }
}

export class HaulerPriority extends SpawnPriority{
    role = "Hauler";
    _max:number;
    constructor(max: number) {
        super();
        this._max = max;
        this.body = [CARRY, CARRY, MOVE, MOVE];
    }

    getBodyPart(roomInfo: RoomInfo) : BodyPartConstant[]{
        var newBodyPart = [CARRY, CARRY, MOVE];
        var cap = Math.max(Game.rooms[roomInfo.name].energyCapacityAvailable - 200, 150);
        while (cap > 100) {
            newBodyPart.push(CARRY);
            newBodyPart.push(MOVE);
            cap -= 100;
        }
        return newBodyPart;
    }

    getWeight(game: Game, roomInfo: RoomInfo) : number{
        var amountOfStaticHarvestPlaces = this.amountOfStaticHarvestingSpots(roomInfo);
        if (roomInfo.getRoleAmount(this.role) >= amountOfStaticHarvestPlaces) {
            return 0;
        }
        if(roomInfo.screepRoles[this.role] >= this.getMax()){
            return 0;
        }
        return 1 + ((this.getMax()+1) / (roomInfo.getRoleAmount(this.role)+1));
    }
    
    getMax(){
        return this._max;
    }
}

export class RedistributorPriority extends SpawnPriority{
    role = "Redistributor";
    _max:number;
    constructor(max: number) {
        super();
        this._max = max;
        this.body = [CARRY, CARRY, MOVE, MOVE];
    }

    getBodyPart(roomInfo: RoomInfo) : BodyPartConstant[]{
        var newBodyPart = [CARRY, CARRY, MOVE];
        var cap = Math.max(Game.rooms[roomInfo.name].energyCapacityAvailable - 200, 100);
        while (cap > 100) {
            newBodyPart.push(CARRY);
            newBodyPart.push(MOVE);
            cap -= 100;
        }
        return newBodyPart;
    }

    getWeight(game: Game, roomInfo: RoomInfo) : number{
        if(roomInfo.getRoleAmount(this.role) >= this.getMax()){
            return 0;
        }
        if (Memory.containerData.baseStorage.length) {
            var hasEnergyInBaseStorage = false;
            for (let i = 0; i < Memory.containerData.baseStorage.length; i++) {
                let id = Memory.containerData.baseStorage[i];
                if ((Game.getObjectById(id) as StructureContainer).store[RESOURCE_ENERGY] > 0) {

                    hasEnergyInBaseStorage = true;
                    break;
                }
            }
            if (hasEnergyInBaseStorage) {
                return 1 + ((this.getMax()+1) / (roomInfo.getRoleAmount(this.role)+1));
            }
        }
        return 0;
    }
    
    getMax(){
        return this._max;
    }
}





export interface Dictionary<T> {
    [index: string]: T;
}

var spawnLogic: Dictionary<List<SpawnPriority>> = {
    "W2N5" : [new BuilderPriority(2), new UpgraderPriority(3), new HarvesterRunnerPriority(4), new StaticHarvesterPriority(), new HaulerPriority(2), new RedistributorPriority(2)]
}



export class SpawnController {
    
    public static update(spawner: StructureSpawn): void {
        var spawnPriorities = spawnLogic[spawner.room.name];
        var roomInfo =  MapInfoController.getRoomScreepInfo(spawner.room.name);
        var chosenSpawn = SpawnController.getHighestSpawnPriority(Game, spawnPriorities, roomInfo);
        if (chosenSpawn != null){
            spawner.spawnCreep(chosenSpawn.getBodyPart(roomInfo), chosenSpawn.role + Game.time, {memory: {role: chosenSpawn.role, origin: spawner.room.name, state: ScreepState.INITIAL_SPAWN, prevState: ScreepState.INITIAL_SPAWN, target: null}});
        }
    }

    public static getHighestSpawnPriority(game: Game, list: List<SpawnPriority>, roomInfo: RoomInfo): SpawnPriority | null{
        var heighestPriority = Number.MIN_SAFE_INTEGER;
        var heighestSpawn : SpawnPriority | null = null;
        for (let i = 0; i < list.length; i++) {
            let spawnPriority = list[i];
            let val = spawnPriority.getWeight(game, roomInfo);
            if (val > heighestPriority){
                heighestPriority = val;
                heighestSpawn = spawnPriority;
            }
        }
        if (heighestPriority >= 1){
            return heighestSpawn;
        }
        return null;
    }

    public static areAllCreepsSpawned(room: string, ignoreRoles: string[] = []): boolean{
        var chosenSpawn = SpawnController.getHighestSpawnPriority(Game, spawnLogic[room], MapInfoController.getRoomScreepInfo(room));
        return chosenSpawn == null || ignoreRoles.includes(chosenSpawn.role);
    }


    
}