var alldata = {};
export class EntityQueryOptions{
    closests = -32767;
    excludeFamilies = [""];
    /**
     * GameMode[]
     */
    excludeGameModes = [""];
    excludeNames = [""];
    excludeTags = [""];
    excludeTypes = [""];
    families = [""];
    farthest = -32767;
    /**
     * GameMode
     */
    gameMode = "";
    /**
     * Location
     */
    location = "";
    maxDistance = -32767;
    maxHorizontalRotation = -32767;
    maxLevel = -32767;
    maxVerticalRotation = -32767;
    minDistance = -32767;
    minHorizontalRotation = -32767;
    minLevel = -32767;
    minVerticalRotation = -32767;
    name = "";
    /**
     * EntityQueryOptionsScore
     */
    scoreOptions = "";
    tags = [""];
    type = "";
    /**
     * BlockAreaSize
     */
    volume = "";

    getOptions(){
        if(this.closests != -32767) alldata.closests = this.closests;
        if(this.excludeFamilies != "") alldata.excludeFamilies = this.excludeFamilies;
        if(this.excludeGameModes != "") alldata.excludeGameModes = this.excludeGameModes;
        if(this.excludeNames != "") alldata.excludeNames = this.excludeNames;
        if(this.excludeTags != "") alldata.excludeTags = this.excludeTags;
        if(this.excludeTypes != "") alldata.excludeTypes = this.excludeTypes;
        if(this.families != "") alldata.families = this.families;
        if(this.farthest != -32767) alldata.farthest = this.farthest;
        if(this.gameMode != "") alldata.gameMode = this.gameMode;
        if(this.location != "") alldata.location = this.location;
        if(this.maxDistance != -32767) alldata.maxDistance = this.maxDistance;
        if(this.maxHorizontalRotation != -32767) alldata.maxHorizontalRotation = this.maxHorizontalRotation;
        if(this.maxLevel != -32767) alldata.maxLevel = this.maxLevel;
        if(this.maxVerticalRotation != -32767) alldata.maxVerticalRotation = this.maxVerticalRotation;
        if(this.minDistance != -32767) alldata.minDistance = this.minDistance;
        if(this.minHorizontalRotation != -32767) alldata.minHorizontalRotation = this.minHorizontalRotation;
        if(this.minLevel != -32767) alldata.minLevel = this.minLevel;
        if(this.minVerticalRotation != -32767) alldata.minVerticalRotation = this.minVerticalRotation;
        if(this.name != "") alldata.name = this.name;
        if(this.scoreOptions != "") alldata.scoreOptions = this.scoreOptions;
        if(this.tags != "") alldata.tags = this.tags;
        if(this.type != "") alldata.type = this.type;
        return alldata;
    }

    constructor(){}
}
