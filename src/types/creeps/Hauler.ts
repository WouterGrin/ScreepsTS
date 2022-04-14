import { BaseScreep, ScreepState, SourceUserScreep } from "./BaseScreep";

export interface HaulerMemory extends CreepMemory { 
    targetId: Id<AnyStoreStructure>;
    containerId: Id<StructureContainer>;
}

export class Hauler extends BaseScreep {
    public get memory() : HaulerMemory {
        return this.screep.memory as HaulerMemory;
    }
    
    public set memory(v : HaulerMemory) {
        this.screep.memory = v;
    }
    
    constructor(screep: Creep) {
        super(screep);
    }

    public prepare(){
        super.prepare();
        if(this.memory.state == ScreepState.INITIAL_SPAWN){
            this.changeState(ScreepState.IDLE);
        }
        if (this.memory.state == ScreepState.IDLE) {
            if (Game.time % 10 == 0) {
                this.refreshTargetIds();
                this.recheckState();
            }
        }
        switch (this.memory.state) {
            case ScreepState.IDLE:
                if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) != 0) {
                    this.changeState(ScreepState.HAULING);
                }
                if (this.screep.store[RESOURCE_ENERGY] == 0) {
                    this.changeState(ScreepState.RETRIEVING);
                }
            case ScreepState.RETRIEVING:
                if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                    this.changeState(ScreepState.HAULING);
                }
                break;
            case ScreepState.HAULING:
                if (this.screep.store[RESOURCE_ENERGY] == 0) {
                    this.changeState(ScreepState.RETRIEVING);
                }
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
                if (this.memory.targetId != null){
                    let target = Game.getObjectById(this.memory.targetId);
                    if(this.screep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        this.screep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                    if (this.screep.store[RESOURCE_ENERGY] == 0 || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                        this.changeState(ScreepState.IDLE);
                    }
                }else{
                    this.changeState(ScreepState.IDLE);
                }
                break;
            case ScreepState.RETRIEVING:
                if (this.memory.containerId != null) {
                    var container = Game.getObjectById(this.memory.containerId);
                    if(this.screep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        this.screep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                    if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) == 0 || container.store[RESOURCE_ENERGY] == 0) {
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

    public refreshTargetIds(){
        this.memory.targetId = this.checkForTargets();
        this.memory.containerId = this.checkForContainer();
    }

    public recheckState(){

    }

    public changeState(newState: ScreepState){
        super.changeState(newState);
        if (this.memory.state == ScreepState.IDLE) {
            this.refreshTargetIds();
            this.recheckState();
        }
    } 

    public checkForTargets() : Id<AnyStoreStructure>{
        let ret = null;
        var containerTargets = [];
        if (Memory.containerData.baseStorage.length) {
            Memory.containerData.baseStorage.forEach(id => {
                var containerObj = Game.getObjectById(id);
                if (containerObj.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    containerTargets.push(containerObj);
                }
            });
        }
        if (containerTargets.length) {
            containerTargets.sort((a,b) => (a.store[RESOURCE_ENERGY] > b.store[RESOURCE_ENERGY] ? 1 : -1));
            return containerTargets[0].id;
        }
        else{
            var targets = this.screep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if(targets.length) {
                ret = (targets[0] as StructureSpawn).id;
            }
        }
       
        return ret;
    }

    public checkForContainer() : Id<StructureContainer>{
        let ret = null;
        var containerTargets = [];
        for (let key in Memory.containerData.sourceStorage) {
            containerTargets.push(Game.getObjectById(Memory.containerData.sourceStorage[key]))
        }
        if (containerTargets.length) {
            containerTargets.sort((a,b) => (a.store[RESOURCE_ENERGY] > b.store[RESOURCE_ENERGY] ? -1 : 1));
            ret = containerTargets[0].id;
        }
        return ret;
       
    }

   
}