import { SpawnController } from "controllers/SpawnController";
import { BaseScreep, ScreepState } from "./BaseScreep";

export interface BuilderMemory extends CreepMemory {
   
    buildSite: Id<ConstructionSite>;
    repairSite: Id<Structure>;
    wallSite: Id<Structure>;
    spawnerId: Id<StructureSpawn>;
}

export class Builder extends BaseScreep {
    public get memory() : BuilderMemory {
        return this.screep.memory as BuilderMemory;
    }
    
    public set memory(v : BuilderMemory) {
        this.screep.memory = v;
    }
    
    constructor(screep: Creep) {
        super(screep);
    }

    public prepare(){
        super.prepare();
        
        if(this.memory.state == ScreepState.INITIAL_SPAWN){
            this.refreshTargetIds();
            this.recheckState();
        }
        if (this.memory.state == ScreepState.IDLE) {
            if (Game.time % 20 == 0) {
                this.refreshTargetIds();
                this.recheckState();
            }
        }
        switch (this.memory.state) {
            case ScreepState.IDLE:
            case ScreepState.BUILDING:
            case ScreepState.REPAIRING:
            case ScreepState.REPAIRING_WALL:
                if (this.memory.target != null) {
                    if (this.screep.store[RESOURCE_ENERGY] == 0) {
                        if (SpawnController.areAllCreepsSpawned(this.screep.room.name, [this.memory.role])) {
                            this.changeState(ScreepState.HAULING);
                        }
                    }
                }
                break;

            case ScreepState.HAULING:
                
                break;
            default:
                break;
        }
    }

    public update() {
        super.update();
        switch (this.memory.state) {
            case ScreepState.IDLE:
                if (this.memory.target == null) {
                    this.screep.moveTo(14, 28, {visualizePathStyle: {stroke: '#ff0000'}});
                }
                break;

            case ScreepState.HAULING:
                if (this.memory.spawnerId != null){
                    let spawner = Game.getObjectById(this.memory.spawnerId);
                    if(this.screep.withdraw(spawner, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        this.screep.moveTo(spawner, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                    this.changeState(ScreepState.IDLE);
                }
                break;
            case ScreepState.BUILDING:
                if (this.memory.target != null){
                    let buildSite = Game.getObjectById(this.memory.target) as ConstructionSite;
                    if(this.screep.build(buildSite) == ERR_NOT_IN_RANGE) {
                        this.screep.moveTo(buildSite, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                    if (this.screep.store[RESOURCE_ENERGY] == 0 || buildSite == null) {
                        this.changeState(ScreepState.IDLE);
                    }
                }else{
                    this.changeState(ScreepState.IDLE);
                }
                break;
            case ScreepState.REPAIRING:
                if (this.memory.target != null){
                    let repairSite = Game.getObjectById(this.memory.target) as Structure;
                    if(this.screep.repair(repairSite) == ERR_NOT_IN_RANGE) {
                        this.screep.moveTo(repairSite, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                    if (repairSite == null || this.screep.store[RESOURCE_ENERGY] == 0 || repairSite.hits >= repairSite.hitsMax) {
                        this.changeState(ScreepState.IDLE);
                    }
                }else{
                    this.changeState(ScreepState.IDLE);
                }
                break;
            case ScreepState.REPAIRING_WALL:
                if (this.memory.target != null){
                    let wallSite = Game.getObjectById(this.memory.target) as StructureWall;
                    if(this.screep.repair(wallSite) == ERR_NOT_IN_RANGE) {
                        this.screep.moveTo(wallSite, {visualizePathStyle: {stroke: '#ffffff'}});
                    }

                    if (wallSite == null || this.screep.store[RESOURCE_ENERGY] == 0 || wallSite.hits >= wallSite.hitsMax) {
                        this.changeState(ScreepState.IDLE);
                    }
                }else{
                    this.changeState(ScreepState.IDLE);
                }
                break;
            default:
                break;
        }
    }

    public changeState(newState: ScreepState){
        super.changeState(newState);
        if (this.memory.state == ScreepState.IDLE) {
            this.refreshTargetIds();
            this.recheckState();
        }
    } 

    public refreshTargetIds(){
        this.memory.spawnerId = this.checkForSpawner();
        this.memory.buildSite = this.checkForConstructionSites();
        this.memory.repairSite = this.checkForRepairSites();
        this.memory.wallSite = this.checkforWallSites();
    }

    public recheckState(){
        this.memory.target = null;

        if (this.memory.repairSite != null && Game.getObjectById(this.memory.repairSite).hits <= 500) {
            this.memory.target = this.memory.repairSite;
            this.changeState(ScreepState.REPAIRING);
            return;
        }

        if (this.memory.buildSite != null) {
            this.memory.target = this.memory.buildSite;
            this.changeState(ScreepState.BUILDING);
        }
        else if (this.memory.repairSite != null) {
            this.memory.target = this.memory.repairSite;
            this.changeState(ScreepState.REPAIRING);
        }
        else if (this.memory.wallSite != null) {
            this.memory.target = this.memory.wallSite;
            this.changeState(ScreepState.REPAIRING_WALL);
        }
    }

    public checkForSpawner() : Id<StructureSpawn>{
        let ret = null;
        var targets = this.screep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_SPAWN)
            }
        });
        if(targets.length) {
            ret = (targets[0] as StructureSpawn).id;
        }else{
            this.memory.spawnerId = null;
        }
        return ret;
    }

    public checkForConstructionSites() : Id<ConstructionSite>{
        let ret = null;
        const targets = this.screep.room.find(FIND_CONSTRUCTION_SITES);
        if(targets.length) {
            ret = (targets[0] as ConstructionSite).id;
        }
        return ret;
    }

    public checkForRepairSites() : Id<Structure>{
        let ret = null;
        var targets = this.screep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType != STRUCTURE_RAMPART && structure.structureType != STRUCTURE_WALL && structure.hits < structure.hitsMax);
            }
        });

        if(targets.length) {
            ret = (targets[0] as Structure).id;
        }
        return ret;
    }

    public checkforWallSites() : Id<Structure>{
        let ret = null;
        var targets = this.screep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return ((structure.structureType == STRUCTURE_RAMPART || structure.structureType == STRUCTURE_WALL) && structure.hits < structure.hitsMax);
            }
        });
        targets.sort((a,b) => (a.hits > b.hits) ? 1 : ((b.hits > a.hits) ? -1 : 0))
        if(targets.length) {
            ret = (targets[0] as Structure).id;
        }
        return ret;
    }
}