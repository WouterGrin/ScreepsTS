import { ScreepState, SourceUserScreep } from "./BaseScreep";

export interface UpgraderMemory extends SourceUserMemory {
    containerId: Id<AnyStoreStructure>;
}

export class Upgrader extends SourceUserScreep {
    public get memory() : UpgraderMemory {
        return this.screep.memory as UpgraderMemory;
    }
    
    public set memory(v : UpgraderMemory) {
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
                if (this.screep.store[RESOURCE_ENERGY] > 0) {
                    this.changeState(ScreepState.UPGRADING);
                }
                else if (this.screep.store[RESOURCE_ENERGY] == 0) {
                    this.changeState(ScreepState.RETRIEVING);
                }
                else if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                    this.changeState(ScreepState.UPGRADING);
                }
            case ScreepState.RETRIEVING:
            case ScreepState.HARVESTING:
                if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                    this.changeState(ScreepState.UPGRADING);
                }
            case ScreepState.UPGRADING:
                

                if (this.screep.store[RESOURCE_ENERGY] == 0) {
                    if (this.roomInfo.screepRoles["StaticHarvester"] == 0) {
                        this.changeState(ScreepState.HARVESTING);
                    }else{
                        this.changeState(ScreepState.RETRIEVING);
                    }
                    
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

            case ScreepState.RETRIEVING:
                if (this.memory.containerId != null) {
                    var container = Game.getObjectById(this.memory.containerId);
                    if(this.screep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        this.screep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                    if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                        this.changeState(ScreepState.IDLE);
                    }
                }else{
                    this.changeState(ScreepState.IDLE);
                }
                
                break;
            case ScreepState.HARVESTING:
                if (this.memory.sourceId != null) {
                    var source = Game.getObjectById(this.memory.sourceId);
                    if(this.screep.harvest(source) == ERR_NOT_IN_RANGE) {
                        this.screep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                    if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                        this.changeState(ScreepState.IDLE);
                    }
                }else{
                    this.changeState(ScreepState.IDLE);
                }
            case ScreepState.UPGRADING:
                if(this.screep.upgradeController(this.screep.room.controller) == ERR_NOT_IN_RANGE) {
                    this.screep.moveTo(this.screep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
                }
                if (Game.time % 5 == 0) {
                    if (!this.screep.pos.isNearTo(this.screep.room.controller.pos.x, this.screep.room.controller.pos.y)) {
                        this.screep.moveTo(this.screep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                

                if (this.screep.store[RESOURCE_ENERGY] == 0){
                    this.changeState(ScreepState.IDLE);
                }

               
            default:
                break;
        }
    }

    public refreshTargetIds(){
        this.memory.containerId = this.checkForContainer();
        if (this.memory.containerId == null) {
            this.memory.containerId = this.checkForSpawner();
        }
        this.memory.sourceId = this.checkForSource();
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

    public checkForSpawner() : Id<StructureSpawn>{
        let ret = null;
        var targets = this.screep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        if(targets.length) {
            ret = (targets[0] as StructureSpawn).id;
        }
        return ret;
    }

    public checkForContainer() : Id<StructureContainer>{
        var ret = null;
        if (Memory.containerData.controllerUpgradeStorage.length) {
            var targets = [];
            Memory.containerData.controllerUpgradeStorage.forEach(id => {
                var currContainerObj = Game.getObjectById(id);
                if (currContainerObj.store[RESOURCE_ENERGY] > 0) {
                    targets.push(currContainerObj);
                }
            });
            if (targets.length) {
                targets.sort((a,b) => (a.store[RESOURCE_ENERGY] > b.store[RESOURCE_ENERGY] ? -1 : 1));
                ret = targets[0].id;
            }
        }
        
        return ret;
    }

    public checkForSource() : Id<Source>{
        let sources = this.screep.room.find(FIND_SOURCES);
        return sources[0].id;
    }

    
}