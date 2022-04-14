import { catchError } from './utils/ScreepsERR';
import _ from "lodash";
import { SpawnController } from './controllers/SpawnController';
import { MapInfoController } from 'controllers/MapInfoController';
import { BaseScreep } from '$creeps/BaseScreep';
import { Global } from 'Global/Global';
import { Tower } from '$creeps/tower';



export const loop = catchError(() => {
    
    let screeps : BaseScreep[] = [];
    let towers : Tower[] = [];
   
    // DELETE OLD MEMORIES
    for(let name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }else{
            let newScreep = Global.CreateScreep(Game.creeps[name]);
            screeps.push(newScreep);
        }

    }
    // ---
    
    MapInfoController.cleanData();
    MapInfoController.updateRoleData();
    MapInfoController.updateMapData();

    for (let roomKey in Game.rooms) {
        var room = Game.rooms[roomKey];

        var roomInfo = MapInfoController.getRoomScreepInfo(room.name);
        if (roomInfo != null) {

            roomInfo.structureDict[STRUCTURE_TOWER].forEach(obj => {
                var tower = obj as StructureTower;
                towers.push(new Tower(tower));
            });
          
        }
    }

    

    MapInfoController.updateHarvesterData(screeps);
    for (let i = 0; i < screeps.length; i++) {
        let currScreep = screeps[i];
        currScreep.prepare();
    }

    for (let i = 0; i < towers.length; i++) {
        let currTower = towers[i];
        currTower.prepare();
    }
    
    for(const i in Game.spawns) {
        MapInfoController.updateRoleData();
        SpawnController.update(Game.spawns[i]);
    }

    for (let i = 0; i < screeps.length; i++) {
        let currScreep = screeps[i];
        currScreep.update();
    }

    for (let i = 0; i < towers.length; i++) {
        let currTower = towers[i];
        currTower.update();
    }
    

});
