import { ScreepState, SourceUserScreep } from "./BaseScreep";

export interface StaticHarvesterMemory extends SourceUserMemory { 
    containerId: Id<StructureContainer>;
}

export class StaticHarvester extends SourceUserScreep {
    public get memory() : StaticHarvesterMemory {
        return this.screep.memory as StaticHarvesterMemory;
    }
    
    public set memory(v : StaticHarvesterMemory) {
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
                if (this.isConvenientlyFull()) {
                    this.changeState(ScreepState.HAULING);
                }
                if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) != 0) {
                    this.changeState(ScreepState.HARVESTING);
                }
            case ScreepState.HARVESTING:
                if (this.isConvenientlyFull()) {
                    this.changeState(ScreepState.HAULING);
                }
                break;
            case ScreepState.HAULING:
                if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) != 0) {
                    this.changeState(ScreepState.HARVESTING);
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
                if (this.memory.containerId != null){
                    let container = Game.getObjectById(this.memory.containerId);
                    if(this.screep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        this.screep.moveTo(container, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                    if (this.screep.store[RESOURCE_ENERGY] == 0 || container.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
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
                    if (this.isConvenientlyFull()) {
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
        this.memory.containerId = this.checkForContainer();
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

    public checkForContainer() : Id<StructureContainer>{
        return Memory.containerData.sourceStorage[this.memory.sourceId];
    }

    public isConvenientlyFull() : boolean{
        var workParts = this.screep.body.filter(x=>x.type == WORK);
        var carryParts = this.screep.body.filter(x=>x.type == CARRY);
        var carryAmount = carryParts.length * 50;
        var mineAmount = (workParts.length * 2);
        var convenientMaxCapacitity = carryAmount - (carryAmount % mineAmount);
        return this.screep.store[RESOURCE_ENERGY] >= convenientMaxCapacitity; 
    }

    public checkForSource() : Id<Source>{
        if (this.memory.sourceId == null) {
            for (let sourceKey in this.roomInfo.sourceDict) {
                var currSource = this.roomInfo.sourceDict[sourceKey];
                if (currSource.currentStaticHarvesters == 0) {
                     return currSource.id;
                }
            }
        }
        return this.memory.sourceId;
    }
   
}