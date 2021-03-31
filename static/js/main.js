'use strict';
window.$ = window.jQuery = require('jquery');
const { app } = require('electron');
const fs = require('fs');

var PROTO_FILE, TECHTREE_FILE, STRINGTABLE_FILE;
var $proto, $techs, $strings;
var new_strings = {};
var current_unit;

var preferences_file = window.process.argv.filter( s => s.startsWith("--settings_file=") )[0].slice(16);
var preferences;

function savePreferences() {
    fs.writeFile(preferences_file, JSON.stringify({preferences: preferences}), (err) => {
        err ? console.log(err) : console.log("Preferences updated successfully");
    });
}

function loadPreferences() {
    fs.readFile(preferences_file, 'utf8', function (err, data) {
        if (err) {
            preferences = {"theme":"ayu-dark", "xml-editing":true, "live-xml":true, "new-first":true}
            return console.log(err);
        }
        else
            preferences = JSON.parse(data).preferences;
        console.log(preferences);
        if(preferences["xml-editing"]) {
            $("#xml-editing input").attr("checked", "checked");
        }
        else {
            $("#live-xml input").attr("disabled", "disabled");
        }
        if(preferences["live-xml"])
            $("#live-xml input").attr("checked", "checked");
        if(preferences["new-first"])
            $("#new-first input").attr("checked", "checked");
    });
}

function menuAction(action_type) {
    switch (action_type) {
        case "open-xml":
            $("#file-selector").trigger('click');
            break;
        case "preferences-editor":
            document.getElementById("xml-settings-container").style.display = "flex";
            break;
        case "preferences-theme":
            document.getElementById("theme-selection-container").style.display = "flex";
            break;
    
        default:
            break;
    }
}

loadPreferences();
require("electron").ipcRenderer.on("menu-action", function(event, action_type) { menuAction(action_type); });
document.getElementById("settings-help").onclick = (() => { require("electron").shell.openExternal("https://www.moddb.com/members/keremey57") });

var xmlParser = new DOMParser();
var xmlDoc = xmlParser.parseFromString("<root></root>", "text/xml");


document.getElementById("settings-theme").onclick = ( () => {
    document.getElementById("theme-selection-container").style.display = "flex";
});
document.getElementById("settings-xml").onclick = ( () => {
    document.getElementById("xml-settings-container").style.display = "flex";
});
document.getElementById("theme-selection-container").onclick = ( () => {
    document.getElementById("theme-selection-container").style.display = "none";
});
document.getElementById("xml-settings-container").onclick = ( () => {
    document.getElementById("xml-settings-container").style.display = "none";
});
$("#xml-settings").on("click", (e) => {
    let evt = e ? e : window.event;
    if (evt.stopPropagation)
        evt.stopPropagation();
    else
        evt.cancelBubble = true;
    return false; /* Ignore click - to prevent clicks from registering on lower layers */
});
$("#xml-editing").on("click", () => {
    if($("#xml-editing input").attr("checked") == "checked") {
        preferences["xml-editing"] = false;
        if(current_unit != undefined && current_unit.unit_xml_editor != undefined)
        $("#xml-editing input").removeAttr("checked");
        $("#unit-xml").css("display", "none");
        $("#live-xml input").attr("disabled", "true");
    }
    else {
        preferences["xml-editing"] = true;
        $("#xml-editing input").attr("checked", "true");
        if(current_unit != undefined && current_unit.unit_xml_editor == undefined)
            current_unit.createXMLEditor();
        $("#unit-xml").css("display", "block");
        $("#live-xml input").removeAttr("disabled");
    }
    savePreferences();
});
$("#live-xml").on("click", () => {
    if($("#live-xml input").attr("disabled") == "disabled")
        return;
    if($("#live-xml input").attr("checked") == "checked") {
        preferences["live-xml"] = false;
        $("#live-xml input").removeAttr("checked");
    }
    else {
        preferences["live-xml"] = true;
        $("#live-xml input").attr("checked", "true");
    }
    savePreferences();
});
$("#new-first").on("click", () => {
    if($("#new-first input").attr("checked") == "checked") {
        preferences["new-first"] = false;
        $("#new-first input").removeAttr("checked");
    }
    else {
        preferences["new-first"] = true;
        $("#new-first input").attr("checked", "true");
    }
    savePreferences();
});

["theme-ayu-dark", "theme-light", "theme-monokai", "theme-chrome"].forEach(theme => {
    document.getElementById("theme-list").getElementsByClassName(theme)[0].onclick = ( () => {
        document.body.className = theme;
        document.getElementById("theme-selection-container").style.display = "none";
        preferences.theme = theme.slice(6);
        savePreferences();
    });
});


fs.readFile('protor.xml', 'utf8', function (err,data) {
    if (err)
        return console.log(err);
    $proto = $( $.parseXML( data ) );
});
fs.readFile('techtreer.xml', 'utf8', function (err,data) {
    if (err)
        return console.log(err);
    $techs = $( $.parseXML( data ) );
});
fs.readFile('stringtabler.xml', 'utf8', function (err,data) {
    if (err)
        return console.log(err);
    $strings = $( $.parseXML( data ) );
});

function parseFiles() {
    
    document.getElementById("save-button").style.display = "none";
    document.getElementById("settings-button").style.display = "none";
    document.getElementById("settings-container").style.display = "none";
    console.log("Parsing files");
    document.getElementById("base-unit-selection").style.display = "flex";
    document.getElementById("unit").style.display = "inherit";
    document.getElementById("file-message").style.display = "none";
    $proto.find("unit").map(function() {
        document.getElementById("units").innerHTML += `<option value="${$(this).attr('name')}">`;
    }).get();
    document.body.className = `theme-${preferences.theme}`;
    $("#loading-container")[0].style.display = "none";
    document.getElementById("file-uploading").style.display = "block";
    document.getElementById("save-button").style.display = "flex";
    document.getElementById("settings-button").style.display = "flex";
    document.getElementById("settings-container").style.display = "flex";
}

setTimeout(function() {
    if ($proto != undefined && $techs != undefined && $strings != undefined)
        parseFiles();
    else
        setTimeout(function() {
            if ($proto != undefined && $techs != undefined && $strings != undefined)
                parseFiles(); }, 3000);
}, 1000);

var string_id_types = [];

var adjustment_units = [
    {
        weight: 7,
        name: "Musketeer",
        type: "ranged",
        hp: 150,
        categories: [
            "Unit",
            "Ranged",
            "Military",
            "AbstractInfantry",
            "AbstractHeavyInfantry",
            "AbstractGunpowderTrooper",
            "AbstractCavalryInfantry",
            "AbstractRangedInfantry"
        ]
    }, {
        weight: 4,
        name: "Skirmisher",
        type: "ranged",
        hp: 120,
        categories: [
            "AbstractRangedInfantry",
            "AbstractCavalryInfantry",
            "Ranged",
            "AbstractGunpowderTrooper",
            "Unit",
            "UnitClass",
            "Military",
            "AbstractInfantry"
        ]
    }, {
        weight: 1,
        name: "Strelet",
        type: "ranged",
        hp: 90,
        categories: [
            "AbstractGunpowderTrooper",
            "Ranged",
            "HasBountyValue",
            "AbstractCavalryInfantry",
            "AbstractRangedInfantry",
            "UnitClass",
            "Military",
            "Unit",
            "AbstractInfantry"
        ]
    }, {
        weight: 1,
        name: "Pikeman",
        type: "melee",
        hp: 120,
        categories: [
            "Unit",
            "Hand",
            "UnitClass",
            "Military",
            "AbstractHandInfantry",
            "AbstractCavalryInfantry",
            "AbstractPikeman",
            "AbstractHeavyInfantry",
            "AbstractInfantry"
        ]
    }, {
        weight: 1,
        name: "Native Pikeman",
        type: "melee",
        hp: 180,
        categories: [
            "AbstractInfantry",
            "AbstractNativeWarrior",
            "AbstractHeavyInfantry",
            "UnitClass",
            "Military",
            "Unit",
            "AbstractPikeman",
            "AbstractSiegeTrooper",
            "AbstractCavalryInfantry",
            "AbstractHandInfantry"
        ]
    }, {
        weight: 1,
        name: "Native Rifleman",
        type: "ranged",
        hp: 230,
        categories: [
            "AbstractNativeWarrior",
            "UnitClass",
            "Military",
            "Unit",
            "Ranged",
            "AbstractGunpowderTrooper",
            "AbstractCavalryInfantry",
            "AbstractRangedInfantry"
        ]
    }, {
        weight: 2,
        name: "Coyote Runner",
        type: "melee",
        hp: 150,
        categories: [
            "AbstractCavalryInfantry",
            "AbstractHandInfantry",
            "AbstractCoyoteMan",
            "AbstractLightInfantry",
            "Unit",
            "Military",
            "UnitClass"
        ]
    }, {
        weight: 1,
        name: "Aztec Arrow Knight",
        type: "ranged",
        hp: 150,
        categories: [
            "Ranged",
            "AbstractSiegeTrooper",
            "AbstractCavalryInfantry",
            "AbstractRangedInfantry",
            "Unit",
            "UnitClass",
            "Military",
            "AbstractInfantry",
            "AbstractArcher"
        ]
    }, {
        weight: 2,
        name: "Crossbowman",
        type: "ranged",
        hp: 100,
        categories: [
            "Military",
            "UnitClass",
            "Unit",
            "Ranged",
            "AbstractArcher",
            "AbstractInfantry",
            "AbstractCavalryInfantry",
            "AbstractRangedInfantry"
        ]
    }, {
        weight: 1,
        name: "Rajput",
        type: "melee",
        hp: 150,
        categories: [
            "Unit",
            "Military",
            "UnitClass",
            "AbstractHeavyInfantry",
            "AbstractInfantry",
            "AbstractCavalryInfantry",
            "AbstractHandInfantry",
            "AbstractRajput"
        ]
    }, {
        weight: 1,
        name: "Dopplesoldner",
        type: "melee",
        hp: 230,
        categories: [
            "Unit",
            "Military",
            "UnitClass",
            "AbstractInfantry",
            "AbstractHeavyInfantry",
            "HasBountyValue",
            "AbstractCavalryInfantry",
            "AbstractHandInfantry"
        ]
    }, {
        weight: 1,
        name: "Swiss Pikeman",
        type: "melee",
        hp: 320,
        categories: [
            "Unit",
            "UnitClass",
            "Military",
            "Mercenary",
            "AbstractInfantry",
            "AbstractHeavyInfantry",
            "AbstractPikeman",
            "AbstractCavalryInfantry",
            "AbstractHandInfantry"
        ]
    }, {
        weight: 2,
        name: "Black Rider",
        type: "ranged",
        hp: 520,
        categories: [
            "Mercenary",
            "AbstractCavalry",
            "AbstractLightCavalry",
            "Unit",
            "Military",
            "UnitClass",
            "Ranged",
            "AbstractCavalryInfantry",
            "AbstractGunpowderCavalry",
            "AbstractRangedCavalry"
        ]
    }, {
        weight: 2,
        name: "Jaeger",
        type: "ranged",
        hp: 250,
        categories: [
            "AbstractRangedInfantry",
            "AbstractCavalryInfantry",
            "Ranged",
            "AbstractGunpowderTrooper",
            "UnitClass",
            "Military",
            "Unit",
            "AbstractInfantry",
            "Mercenary"
        ]
    }, {
        weight: 3,
        name: "Hussar",
        type: "melee",
        hp: 320,
        categories: [
            "Unit",
            "UnitClass",
            "Military",
            "AbstractCavalry",
            "AbstractHandCavalry",
            "AbstractCavalryInfantry",
            "AbstractHeavyCavalry",
        ]
    }, {
        weight: 1,
        name: "Lancer",
        type: "melee",
        hp: 350,
        categories: [
            "AbstractCavalry",
            "UnitClass",
            "Military",
            "Unit",
            "AbstractLancer",
            "AbstractHeavyCavalry",
            "AbstractCavalryInfantry",
            "AbstractHandCavalry",
        ]
    }, {
        weight: 2,
        name: "Dragoon",
        type: "ranged",
        hp: 200,
        categories: [
            "Unit",
            "Ranged",
            "UnitClass",
            "Military",
            "AbstractRangedCavalry",
            "AbstractGunpowderCavalry",
            "AbstractCavalryInfantry",
            "AbstractCavalry",
            "AbstractLightCavalry"
        ]
    }, {
        weight: 1,
        name: "Native Horse Archer",
        type: "ranged",
        hp: 200,
        categories: [
            "UnitClass",
            "Military",
            "Unit",
            "Ranged",
            "AbstractArcher",
            "AbstractLightCavalry",
            "AbstractCavalry",
            "AbstractNativeWarrior",
            "AbstractRangedCavalry",
            "AbstractCavalryInfantry",
        ]
    }, {
        weight: 1,
        name: "Consulate Uhlan",
        type: "melee",
        hp: 200,
        categories: [
            "AbstractHeavyCavalry",
            "AbstractCavalryInfantry",
            "AbstractHandCavalry",
            "AbstractConsulateUnit",
            "UnitClass",
            "Military",
            "Unit",
            "AbstractCavalry"
        ]
    }, {
        weight: 2,
        name: "Consulate Grenadier",
        type: "melee",
        hp: 200,
        categories: [
            "Ranged",
            "AbstractSiegeTrooper",
            "AbstractCavalryInfantry",
            "AbstractRangedInfantry",
            "AbstractConsulateUnit",
            "AbstractConsulateUnitColonial",
            "AbstractInfantry",
            "AbstractHeavyInfantry",
            "UnitClass",
            "Military",
            "Unit"
        ]
    }, {
        weight: 3,
        name: "Defensive Building",
        type: "building",
        hp: 3000,
        categories: [
            "Building",
            "BuildingClass",
            "MilitaryBuilding",
            "HasBountyValue",
            "AbstractFort",
            "CountsTowardMilitaryScore"
        ]
    }, {
        weight: 3,
        name: "Military Building",
        type: "building",
        hp: 2000,
        categories: [
            "Building",
            "BuildingClass",
            "MilitaryBuilding",
            "AbstractBarracks2",
            "HasBountyValue"
        ]
    }, {
        weight: 2,
        name: "Civic Building",
        type: "building",
        hp: 1500,
        categories: [
            "Building",
            "BuildingClass",
            "Economic",
            "HasBountyValue"
        ]
    }, {
        weight: 3,
        name: "Falconet",
        type: "ranged",
        hp: 200,
        categories: [
            "Ranged",
            "Unit",
            "UnitClass",
            "Military",
            "AbstractArtillery"
        ]
    }, {
        weight: 1,
        name: "Culverin",
        type: "ranged",
        hp: 280,
        categories: [
            "AbstractArtillery",
            "Military",
            "UnitClass",
            "Unit",
            "Ranged"
        ]
    }, {
        weight: 4,
        name: "Ship",
        type: "building",
        hp: 1500,
        categories: [
            "Ship",
            "Transport",
            "Unit",
            "UnitClass",
            "Military",
            "AbstractWarShip",
            "AbstractSiegeTrooper",
            "Ranged"
        ]
    }, {
        weight: 1,
        name: "Warchief",
        type: "melee",
        hp: 700,
        categories: [
            "AbstractInfantry",
            "Hero",
            "Military",
            "UnitClass",
            "Unit",
            "AbstractCanSeeStealth",
            "AbstractHandInfantry",
            "AbstractCavalryInfantry"
        ]
    }, {
        weight: 1,
        name: "Daimyo",
        type: "melee",
        hp: 800,
        categories: [
            "AbstractHandCavalry",
            "AbstractDaimyo",
            "AbstractHeavyCavalry",
            "AbstractCavalryInfantry",
            "Unit",
            "UnitClass",
            "Military",
            "AbstractCavalry"
        ]
    }, {
        weight: 6,
        name: "Villager",
        type: "ranged",
        hp: 150,
        categories: [
            "Unit",
            "UnitClass",
            "Economic",
            "AbstractVillager",
            "Ranged"
        ]
    }, {
        weight: 2,
        name: "Wolf",
        type: "melee",
        hp: 115,
        categories: [
            "NatureClass",
            "AnimalPrey",
            "Unit",
            "Military",
            "Guardian"
        ]
    }, {
        weight: 1,
        name: "Outlaw Rifleman",
        type: "ranged",
        hp: 270,
        categories: [
            "Ranged",
            "Guardian",
            "Military",
            "UnitClass",
            "Unit"
        ]
    }
];

function saveChanges() {
    if(preferences["new-first"]) {
        $proto.find("unit").first().before(current_unit.xml[0]);
        $proto.find("unit").first().after("\n\t");
    }
    else {
        $proto.find("unit").last().after(current_unit.xml[0]);
        $proto.find("unit").last().before("\n\t");
    }
    fs.writeFileSync('protor_new.xml', $proto[0].documentElement.outerHTML, 'utf-8');

    string_id_types.forEach((id_type) => {
        if(id_type.startsWith("unit-")) {
            const id = current_unit[dashToSnakeCase(id_type.slice(5)) + "_id"];
            const str = current_unit[dashToSnakeCase(id_type.slice(5))];
            if($strings.find(`string[_locid=${id}]`)[0] == undefined) {
                let current_id = id - 1;
                while($strings.find(`string[_locid=${current_id}]`)[0] == undefined && id - current_id < 20) {
                    current_id--;
                }
                let new_str = xmlDoc.createElement("string");
                new_str.textContent = str;
                new_str.setAttribute("_locid", id);
                if(id - current_id >= 20)
                    $strings.find("string").last().after(new_str);
                else
                    $strings.find(`string[_locid=${current_id}]`).last().after(new_str);
                $strings.find(`string[_locid=${id}]`)[0].before("\n\t\t");
            }
            else
                $strings.find(`string[_locid=${id}]`).text(str);
        }
    });
    fs.writeFileSync('stringtabler_new.xml', $strings[0].documentElement.outerHTML, 'utf-8');
    console.log("Saved successfully");
}


function prettyPrintXML(xml) {
    let xmlDoc = new DOMParser().parseFromString(xml, 'application/xml');
    let xsltDoc = new DOMParser().parseFromString([
        // describes how we want to modify the XML - indent everything
        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:strip-space elements="*"/>',
        '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
        '    <xsl:value-of select="normalize-space(.)"/>',
        '  </xsl:template>',
        '  <xsl:template match="node()|@*">',
        '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
        '  </xsl:template>',
        '  <xsl:output indent="yes"/>',
        '</xsl:stylesheet>',
    ].join('\n'), 'application/xml');

    let xsltProcessor = new XSLTProcessor();    
    xsltProcessor.importStylesheet(xsltDoc);
    let resultDoc = xsltProcessor.transformToDocument(xmlDoc);
    let resultXml = new XMLSerializer().serializeToString(resultDoc);
    return resultXml;
};


function bindStrings(strings_to_bind = string_id_types, obj) {
    strings_to_bind.forEach(string_id => {
        document.getElementById(string_id).onchange = (() => { obj.setString(string_id); });
        document.getElementById(string_id + "-id").onchange = (() => { obj.setString(string_id); });
    });
}


function checkDuplicates(string_id, string_content) {
    let warning = 0;
    string_id_types.forEach(string_type => {
        if (document.getElementById(string_type + "-id").value == string_id
        && document.getElementById(string_type).value !== string_content) {
            warning = 3;
            if (document.getElementById(string_type + "-warning").className == "warning-sign") {
                document.getElementById(string_type + "-warning").classList.add("critical");
                document.getElementById(string_type + "-warning").getElementsByClassName("warning-tooltip")[0].textContent = 
                    "You have already used this ID for another string";
                setTimeout(() => {
                        document.getElementById(string_type + "-warning").classList.remove("critical");
                }, 2500);
            }
        }
    });
    return(warning);
}


function getMultiplier(attack, enemy_unit) {
    let multiplier = -1;
    for (const category in attack.multipliers) {
        if (attack.multipliers.hasOwnProperty(category)) {
            const bonus = attack.multipliers[category];
            if(enemy_unit.categories.includes(category)) {
                //console.log(`Bonus against ${category}: ${bonus}`);
                multiplier = Math.max(multiplier, bonus);
            }
        }
    }
    if(multiplier === -1)
        multiplier = 1;
    //console.log(`Total multiplier against ${enemy_unit.name}: ${multiplier}`);
    return(multiplier);
}


function getString(locid) {
    return $strings.find(`string[_locid=${locid}]`).text();
}

function get(query, _unit=unit_xml) {
    if (_unit.attr(query) !== undefined)
        return _unit.attr(query);
    return _unit.find(query).text();
}

const camelToSnakeCase = str => {
    str = str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return(str[0] === '_' ? str.slice(1) : str);
}

const dashToSnakeCase = str => {
    return(str.replace(/-/g, "_"));
}

const camelToDashCase = str => {
    str = str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    return(str[0] === '-' ? str.slice(1) : str);
}


class Tech {
    constructor(xml) {
        let $xml = $( xml );
        this.xml = xml;
        this.element_name = camelToDashCase(xml.getAttribute("name"));
        this.name = xml.getAttribute("name");
        this.display_name_id = parseInt($xml.find(`displaynameid`).text());
        this.rollover_id = parseInt($xml.find(`rollovertextid`).text());
        this.display_name = getString(this.display_name_id);
        this.rollover = getString(this.rollover_id);
        this.id = parseInt(xml.getElementsByTagName("dbid")[0].textContent);
        this.icon = xml.getElementsByTagName("icon")[0].textContent;
        this.research_time = parseInt(xml.getElementsByTagName("researchpoints")[0].textContent);
        ["Food", "Wood", "Gold", "Trade"].forEach(resource => {
            let cost = $xml.find(`cost[resourcetype="${resource}"]`).text();
            if (cost == '')
                cost = 0;
            this[`${resource.toLowerCase()}_cost`] = parseInt(cost);
        });
        this.update_visuals = ($xml.find(`effects>effect[subtype="UpdateVisual"]`).length > 0);
        this.new_name_id = null;
        this.new_name = '';
        if($xml.find(`effects>effect[type="SetName"]`).length > 0) {
            this.new_name_id = $xml.find(`effects>effect[type="SetName"]`).attr("newname");
            this.new_name = getString(this.new_name_id);
        }

        this.age = "none";
        this.prerequisites = [];
        if($xml.find(`prereqs>techstatus[status="Active"]`).length > 0) {
            this.age = $xml.find(`prereqs>techstatus[status="Active"]`);
            for (const prereq of this.age) {
                if(prereq.textContent.endsWith("ize")) {
                    this.age = prereq.textContent;
                    break;
                } else
                    this.prerequisites += prereq.textContent;
            }
        }
        this.hpIncrease = 1.0;
        this.hpRelativity = "BasePercent";
        if($xml.find(`effects>effect[subtype="Hitpoints"]`).length > 0) {
            this.hpIncrease = parseFloat($xml.find(`effects>effect[subtype="Hitpoints"]`).attr("amount"));
            this.hpRelativity = $xml.find(`effects>effect[subtype="Hitpoints"]`).attr("relativity");
        }
        this.damageIncrease = 1.0;
        this.damageRelativity = "BasePercent";
        if($xml.find(`effects>effect[subtype="Damage"]`).length > 0) {
            this.damageIncrease = parseFloat($xml.find(`effects>effect[subtype="Damage"]`).attr("amount"));
            this.damageRelativity = $xml.find(`effects>effect[subtype="Damage"]`).attr("relativity");
        }
    }

    render() {
        let checked_visuals = this.update_visuals ? 'checked' : '';
        return `
        <table class="tech-container" id="${this.element_name}">
            <thead>
                <tr>
                    <th colspan="4">
                        <h5>
                            <span class="warning-sign id-warning" id="${this.element_name}-id-warning">
                                <span class="tooltip-container">⚠</span>
                                <span class="warning-tooltip">This ID is already occupied by another technology.</span>
                            </span>
                            <span>
                                <span class="comment">#</span>
                                <input id="${this.element_name}-id" class="tech-id comment" type="number" value="${this.id}">
                            </span>
                            <span class="warning-sign name-warning" id="${this.element_name}-name-warning">
                                <span class="tooltip-container">⚠</span>
                                <span class="warning-tooltip">This name is already used by another technology.</span>
                            </span>
                            <span>
                                <input id="${this.element_name}-name" class="mid-text" value="${this.name}">
                            </span>
                        </h5>
                        <button id="${this.element_name}-delete-button" class="tech-delete-button">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-9.414l2.828-2.829 1.415 1.415L13.414 12l2.829 2.828-1.415 1.415L12 13.414l-2.828 2.829-1.415-1.415L10.586 12 7.757 9.172l1.415-1.415L12 10.586z"/></svg>
                        </button>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="tech-fixed-width tag">Displayed name:</td>
                    <td class="warning-sign" id="${this.element_name}-display-name-warning">
                        <span class="tooltip-container">⚠</span>
                        <span class="warning-tooltip"></span>
                    </td>
                    <td>
                        <input type="number" class="numeric string-id" id="${this.element_name}-display-name-id" value="${this.display_name_id}">
                    </td>
                    <td><input id="${this.element_name}-display-name" class="short-text" value="${this.display_name}"></td>
                </tr>
                <tr>
                    <td class="tech-fixed-width tag">Rollover:</td>
                    <td class="warning-sign" id="${this.element_name}-rollover-warning">
                        <span class="tooltip-container">⚠</span>
                        <span class="warning-tooltip"></span>
                    </td>
                    <td>
                        <input type="number" class="numeric string-id" id="${this.element_name}-rollover-id" value="${this.rollover_id}">
                    </td>
                    <td><input id="${this.element_name}-rollover" class="long-text" value="${this.rollover}"></td>
                </tr>
            </tbody>
        </table>
        <table id="${this.element_name}-cost" class="tech-cost">
            <thead></thead>
            <tbody>
                <tr>
                    <td id="${this.element_name}-food-tag" class="tag cost-tag">Food:</td>
                    <td id="${this.element_name}-food"><span class="food-icon">🥩 </span>
                        <input class="numeric cost" id="${this.element_name}-food-cost" type="number" step="5" min="0" value="${this.food_cost}">
                    </td>
                    <td>  </td>
                    <td class="tag">Icon:</td>
                    <td>
                        <span class="warning-sign" id="${this.element_name}-icon-warning">
                            <span class="tooltip-container">⚠</span>
                            <span class="warning-tooltip"></span>
                        </span>
                        <input id="${this.element_name}-icon" class="mid-text" type="text" value="${this.icon}">
                    </td>
                </tr>
                <tr>
                    <td id="${this.element_name}-wood-tag" class="tag cost-tag">Wood:</td>
                    <td id="${this.element_name}-wood"><span class="wood-icon">🌳 </span>
                        <input class="numeric cost" id="${this.element_name}-wood-cost" type="number" step="5" min="0" value="${this.wood_cost}">
                    </td>
                    <td>  </td>
                    <td id="${this.element_name}-research-time-tag" class="tag">Research time:</td>
                    <td><span>🕔 </span><input class="numeric" id="${this.element_name}-research-time" type="number" min="0" value="${this.research_time}"></td>
                </tr>
                <tr>
                    <td id="${this.element_name}-gold-tag" class="tag cost-tag">Gold:</td>
                    <td id="${this.element_name}-gold"><span class="gold-icon">💰 </span>
                        <input class="numeric cost" id="${this.element_name}-gold-cost" type="number" step="5" min="0" value="${this.gold_cost}">
                    </td>
                    <td>  </td>
                    <td id="${this.element_name}-age-tag" class="tag">Age:</td>
                    <td>
                        <select class="numeric" id="${this.element_name}-age" value="${this.age}">
                            <option value="none" ${(this.age == "none" ? "selected" : '')}>I</option>
                            <option value="Colonialize" ${(this.age == "Colonialize" ? "selected" : '')}>II</option>
                            <option value="Fortressize" ${(this.age == "Fortressize" ? "selected" : '')}>III</option>
                            <option value="Industrialize" ${(this.age == "Industrialize" ? "selected" : '')}>IV</option>
                            <option value="Imperialize" ${(this.age == "Imperialize" ? "selected" : '')}>V</option>
                        </select>
                    </td>
                </tr>
            </tbody>
        </table>
        <table id="${this.element_name}-effects" class="tech-effects">
            <thead></thead>
            <tbody>
                <tr>
                    <td class="tech-fixed-width tag">Damage:</td>
                    <td>
                        <input id="${this.element_name}-damage" class="numeric" type="number" min="0.0" step="0.1" value="${this.damageIncrease}">
                    </td>
                    <td>
                        <span class="comment">relativity:</span>
                    </td>
                    <td>
                        <select name="${this.element_name}-damage-relativity" id="${this.element_name}-damage-relativity">
                            <option value="BasePercent" ${(this.damageRelativity == "BasePercent" ? "selected" : '')}>Base percent</option>
                            <option value="Absolute" ${(this.damageRelativity == "Absolute" ? "selected" : '')}>Absolute</option>
                            <option value="Percent" ${(this.damageRelativity == "Percent" ? "selected" : '')}>Current percent</option>
                            <option value="Assign" ${(this.damageRelativity == "Assign" ? "selected" : '')}>Assign</option>
                        </select>
                    </td>
                    <td>
                        <span class="comment">actions:</span>
                    </td>
                    <td>
                        <select name="${this.element_name}-damage-actions" id="${this.element_name}-damage-actions">
                            <option value="all">All</option>
                            <option value="VolleyHandAttack">Volley Hand Attack</option>
                            <option value="DefendHandAttack">Defend Hand Attack</option>
                            <option value="StaggerHandAttack">Stagger Hand Attack</option>
                            <option value="MeleeHandAttack">Melee Hand Attack</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td class="tech-fixed-width tag">HP:</td>
                    <td>
                        <input id="${this.element_name}-hp" class="numeric" type="number" min="0.0" step="0.1" value="${this.hpIncrease}">
                    </td>
                    <td>
                        <span class="comment">relativity:</span>
                    </td>
                    <td>
                        <select name="${this.element_name}-hp-relativity" id="${this.element_name}-hp-relativity">
                            <option value="BasePercent" ${(this.hpRelativity == "BasePercent" ? "selected" : '')}>Base percent</option>
                            <option value="Absolute" ${(this.hpRelativity == "Absolute" ? "selected" : '')}>Absolute</option>
                            <option value="Percent" ${(this.hpRelativity == "Percent" ? "selected" : '')}>Current percent</option>
                            <option value="Assign" ${(this.hpRelativity == "Assign" ? "selected" : '')}>Assign</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td id="${this.element_name}-new-name-tag" class="tech-fixed-width tag">New name:</td>
                    <td style="min-width: 6rem;">
                        <span class="warning-sign" id="${this.element_name}-new-name-warning">
                            <span class="tooltip-container">⚠</span>
                            <span class="warning-tooltip"></span>
                        </span>
                        <span>
                            <input type="number" class="numeric string-id" id="${this.element_name}-new-name-id" value="${this.new_name_id}">
                        </span>
                    </td>
                    <td colspan="3"><input id="${this.element_name}-new-name" class="short-text" value="${this.new_name}"></td>
                </tr>
                <tr>
                    <td class="tech-fixed-width tag">Visuals:</td>
                    <td colspan="2">
                        <span style="display: flex; justify-content: center;">
                            <label id="${this.element_name}-update-visual" class="toggle" style="margin-top: 0.25rem;">
                                <input type="checkbox" ${checked_visuals}/>
                                <span class="slider"></span>
                            </label>
                            <span class="comment">update</span>
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    `;    
    }

    bindToDocument() {
        document.getElementById(`${this.element_name}-id`).onchange = ( () => {this.setTechID();} );
        document.getElementById(`${this.element_name}-name`).onchange = ( () => {this.setName();} );
        document.getElementById(`${this.element_name}-age`).onchange = ( () => {this.setAge();} );
        document.getElementById(`${this.element_name}-research-time`).onchange = ( () => {this.setNumber("research-time", "instant");} );
        bindStrings([`${this.element_name}-display-name`, `${this.element_name}-rollover`, `${this.element_name}-new-name`], this);
        string_id_types = string_id_types.concat([`${this.element_name}-display-name`, `${this.element_name}-rollover`, `${this.element_name}-new-name`]);
        this.setTechID();
        this.setName();
        [`${this.element_name}-display-name`, `${this.element_name}-rollover`, `${this.element_name}-new-name`].forEach((string_type) => {
            this.setString(string_type);
        });
        document.getElementById(`${this.element_name}-delete-button`).onclick = ( () => {
            delete current_unit.upgrades[this.element_name];
            document.getElementById(`${this.element_name}`).remove();
            document.getElementById(`${this.element_name}-cost`).remove();
            document.getElementById(`${this.element_name}-effects`).remove();
        });
        ["food", "wood", "gold"].forEach(resource => {
            document.getElementById([`${this.element_name}-${resource}-cost`]).onclick = ( () => {this.setCost(resource);} );
        });
    }
    setTechID() {
        this.id = parseInt(document.getElementById(`${this.element_name}-id`).value);
        if ($techs.find(`tech>dbid:contains(${this.id})`).length > 0)
            document.getElementById(`${this.element_name}-id-warning`).classList.add("critical");
        else
            document.getElementById(`${this.element_name}-id-warning`).classList.remove("critical");
    }
    setName() {
        this.name = document.getElementById(`${this.element_name}-name`).value;
        if ($techs.find(`tech[name="${this.name}"]`).length > 0)
            document.getElementById(`${this.element_name}-name-warning`).classList.add("critical");
        else
            document.getElementById(`${this.element_name}-name-warning`).classList.remove("critical");
    }
    setAge() {
        this.age = document.getElementById(`${this.element_name}-age`).value;
    }
    setCost(resource) {
        this[`${resource}_cost`] = parseInt(document.getElementById([`${this.element_name}-${resource}-cost`]).value);
        if (this[`${resource}_cost`] > 0) {
            document.getElementById(`${this.element_name}-${resource.toLowerCase()}-tag`).style.opacity = 0.9;
            document.getElementById(`${this.element_name}-${resource.toLowerCase()}`).style.opacity = 0.9;
        }
        else {
            document.getElementById(`${this.element_name}-${resource.toLowerCase()}-tag`).style.opacity = 0.5;
            document.getElementById(`${this.element_name}-${resource.toLowerCase()}`).style.opacity = 0.5;
        }
        console.log(this);
    }
    setNumber(field_name, null_value=0, is_float=false) {
        let field_name_snake_case = field_name.replace(/-/g, '_');
        field_name = this.element_name + '-' + field_name;
        if (is_float)
            this[field_name_snake_case] = parseFloat(document.getElementById(field_name).value);
        else
            this[field_name_snake_case] = parseInt(document.getElementById(field_name).value);
        if (isNaN(this[field_name_snake_case]) || this[field_name_snake_case] == 0) {
            this[field_name_snake_case] = 0;
            document.getElementById(field_name).style.opacity = 0.5;
            document.getElementById(field_name + "-tag").style.opacity = 0.5;
            if (typeof(null_value) == "string")
                document.getElementById(field_name).type = "text";
            document.getElementById(field_name).value = null_value;
        }
        else {
            document.getElementById(field_name).style.opacity = 0.9;
            document.getElementById(field_name + "-tag").style.opacity = 0.9;
            document.getElementById(field_name).type = "number";
        }
    }
    setString(string_name) {
        let string_name_snake_case = string_name.replace(this.element_name + '-', '').replace(/-/g, '_');
        let string_id = parseInt(document.getElementById(`${string_name}-id`).value)
        this[string_name_snake_case] = document.getElementById(string_name).value;
        this[string_name_snake_case + "_id"] = string_id;
    
        let warning = checkDuplicates(string_id, this[string_name_snake_case]);

        if (string_name.endsWith("new-name") && (this[string_name_snake_case] === '' || isNaN(string_id))) {
            document.getElementById(string_name + "-id").style.opacity = 0.5;
            document.getElementById(string_name + "-tag").style.opacity = 0.5;
            document.getElementById(string_name).style.opacity = 0.5;
        } else if (string_name.endsWith("new-name")) {
            document.getElementById(string_name + "-id").style.opacity = 1.0;
            document.getElementById(string_name + "-tag").style.opacity = 1.0;
            document.getElementById(string_name).style.opacity = 1.0;
        }
        if (getString(string_id) != '') {
            if (getString(string_id) != this[string_name_snake_case])
                warning = 1;
            else
                warning = 2;
        }

        document.getElementById(string_name + "-warning").classList.remove("warning");
        document.getElementById(string_name + "-warning").classList.remove("critical");
        switch (warning) {
            case 1:
                document.getElementById(string_name + "-warning").classList.add("critical");
                document.getElementById(string_name + "-warning").getElementsByClassName("warning-tooltip")[0].textContent = 
                    "This string is already occupied by other text. Replacing it may corrupt the game.";
                break;
            case 2:
                document.getElementById(string_name + "-warning").classList.add("warning");
                document.getElementById(string_name + "-warning").getElementsByClassName("warning-tooltip")[0].textContent = 
                    "This string ID is already in use. It is recommended to use new strings for modded content.";
                break;
            case 3:
                document.getElementById(string_name + "-warning").classList.add("critical");
                document.getElementById(string_name + "-warning").getElementsByClassName("warning-tooltip")[0].textContent = 
                    "You have already used this ID for another string";
                break;
            default:
                break;
        }
    }
}


class Unit {

    constructor(xml) {
        this.xml = $(xml[0]);
        this.id = parseInt(get("id", xml));
        this.name = get("name", xml);
        this.display_name_id = parseInt(get("displaynameid", xml));
        this.display_name = getString(get("displaynameid", xml));
        try {
            this.editor_name_id = parseInt(get("editornameid", xml));
            this.editor_name = getString(get("editornameid", xml));
        } catch {
            this.editor_name_id = this.display_name_id;
            this.editor_name = this.display_name;
        }
        this.rollover_id = parseInt(get("rollovertextid", xml));
        this.rollover = getString(get("rollovertextid", xml));
        this.shortrollover_id = parseInt(get("shortrollovertextid", xml));
        this.shortrollover = getString(get("shortrollovertextid", xml));

        this.file_path = get("animfile", xml);
        this.file_path = this.file_path.slice(0, this.file_path.indexOf(this.name.toLowerCase()));
        if(this.file_path.includes('.'))
            this.file_path = this.file_path.split('\\').slice(0, 2).join('\\') + '\\'
        this.total_cost = 0;
        ["Food", "Wood", "Gold", "Trade"].forEach(resource => {
            let cost = get(`cost[resourcetype=${resource}]`, xml);
            if (cost == '')
                cost = 0;
            this[`${resource.toLowerCase()}_cost`] = parseInt(cost);
            this.total_cost += parseInt(cost);
        });
        this.population = parseInt(get("populationcount", xml));
        if (isNaN(this.population) || this.population == '')
            this.population = 0;
        this.train_time = parseInt(get("trainpoints", xml));
        this.build_limit = parseInt(get("buildlimit", xml));
        this.age = parseInt(get("allowedage"));
        
        this.hp = parseInt(get("maxhitpoints"));
        this.armor = parseFloat(unit_xml.find("armor").attr("value"));
        this.armor_type = unit_xml.find("armor").attr("type");
        this.speed = parseFloat(get("maxvelocity"));
        this.los = parseFloat(get("los"));
        this.adjusted_hp = parseInt(this.hp / (1 - this.armor / 2.5));

        let actions = xml.find("protoaction");
        let action_types = {
            "HandAttack" : "melee",
            "ChargeAttack" : "melee",
            "RangedAttack" : "ranged",
            "VolleyAttack" : "ranged",
            "BowAttack" : "ranged",
            "GrenadeAttack" : "ranged",
            "BuildingAttack" : "siege",
            "CannonAttack" : "cannon",
            "Attack" : "attacks",
            "": "other"
        }
        this.protoactions = {
            melee: [],
            ranged: [],
            siege: [],
            cannon: [],
            attacks: [],
            other: []
        }
        this.main_attacks = {
            melee: {damage: 0, rof: 3, range: 0, damagearea: 0, damagecap: 0, multipliers: {}},
            ranged: {damage: 0, rof: 3, range: 0, damagearea: 0, damagecap: 0, multipliers: {}},
            siege: {damage: 0, rof: 3, range: 0, damagearea: 0, damagecap: 0, multipliers: {}},
            cannon: {damage: 0, rof: 3, range: 0, damagearea: 0, damagecap: 0, multipliers: {}}
        }
        for (const key in actions) {
            if (actions.hasOwnProperty(key) && typeof(actions[key]) == "object") {
                const action = actions[key];
                try {
                    let protoaction = {
                        name: action.getElementsByTagName("name")[0].textContent,
                        multipliers: {},
                        xml: action,
                        damagearea: 0,
                        damagecap: 0,
                        range: 0
                    };
                    let action_type;
                    for (const attack_type in action_types)
                        if (action_types.hasOwnProperty(attack_type) && action.getElementsByTagName("name")[0].textContent.endsWith(attack_type)) {
                            action_type = action_types[attack_type];
                            break;
                        }
                    protoaction["damage"] = parseFloat(action.getElementsByTagName("damage")[0].textContent);
                    protoaction["rof"] = parseFloat(action.getElementsByTagName("rof")[0].textContent);
                    if (action.getElementsByTagName("maxrange").length)
                        protoaction["range"] = parseFloat(action.getElementsByTagName("maxrange")[0].textContent);
                    if (action.getElementsByTagName("damagearea").length) {
                        protoaction["damagearea"] = parseFloat(action.getElementsByTagName("damagearea")[0].textContent);
                        protoaction["damagecap"] = parseFloat(action.getElementsByTagName("damagecap")[0].textContent);
                    }
                    let bonuses = action.getElementsByTagName("damagebonus");
                    for (const _ in bonuses)
                        if (bonuses.hasOwnProperty(_))
                            protoaction["multipliers"][[bonuses[_].getAttribute("type")]] = parseFloat(bonuses[_].textContent);
                    this.protoactions[action_type].push(protoaction);
                } catch(e) { console.log(e); }
            }
        }
        for (const type in this.main_attacks) {
            if (this.main_attacks.hasOwnProperty(type)) {
                this.protoactions[type].forEach(action => {
                    if (action.damage / action.rof > this.main_attacks[type].damage / this.main_attacks[type].rof) {
                        this.main_attacks[type].damage = action.damage;
                        this.main_attacks[type].rof = action.rof;
                        this.main_attacks[type].range = action.range;
                        this.main_attacks[type].multipliers = action.multipliers;
                        this.main_attacks[type].damagearea = action.damagearea;
                        this.main_attacks[type].damagecap = Math.max(action.damagecap, action.damage);
                    }
                });
            }
        }
        this.base_attacks = this.main_attacks;
        let attack = Math.max(this.main_attacks.ranged.damage / this.main_attacks.ranged.rof, this.main_attacks.melee.damage / this.main_attacks.melee.rof);
        if (attack == 0)
            attack = Math.max(this.main_attacks.cannon.damage / this.main_attacks.cannon.rof, this.main_attacks.siege.damage / this.main_attacks.siege.rof);
        attack *= 3;
        this.adjusted_attack = parseInt(4 * attack) / 4;
        this.specialization = 0;
        this.efficiency = 0;
    }

    render() {
        document.getElementById("unit-main-name").textContent = this.display_name;

        document.getElementById("unit-id").value = this.id;
        this.setUnitID();
        document.getElementById("unit-name").value = this.name;
        this.setName();
        ["display-name",
         "editor-name",
         "rollover",
         "shortrollover"].forEach(field => {
            document.getElementById(`unit-${field}`).value = this[field.replace(/-/g, '_')];
            document.getElementById(`unit-${field}-id`).value = this[`${field}_id`.replace(/-/g, '_')];
            this.setString(`unit-${field}`);
        });
        ["food", "wood", "gold", "trade"].forEach(resource => {
            document.getElementById(`unit-${resource}-cost`).value = this[`${resource}_cost`];
            this.setCost(resource);
        });
        ["population", "train-time", "los"].forEach(field => {
            document.getElementById(`unit-${field}`).value = this[field.replace(/-/g, '_')];
            this.setNumber(`unit-${field}`);
        });
        document.getElementById("unit-limit").value = this.build_limit;
        this.setNumber("unit-limit", "inf");
        document.getElementById("unit-speed").value = this.speed;
        this.setNumber("unit-speed", '-', true);

        document.getElementById("unit-armor").value = this.armor;
        document.getElementById("unit-armor-type").value = this.armor_type;

        document.getElementById("unit-age").value = this.age;
        document.getElementById("unit-hp").value = this.hp;
        this.setHP();

        ["ranged", "melee", "siege", "cannon"].forEach(attack_type => {
            const attack = this.main_attacks[attack_type];
            document.getElementById(`unit-${attack_type}-attack`).value = attack.damage;
            document.getElementById(`unit-${attack_type}-rof`).value = attack.rof;
            document.getElementById(`unit-${attack_type}`).getElementsByClassName("unit-damagearea")[0].value = attack.damagearea;
            document.getElementById(`unit-${attack_type}`).getElementsByClassName("unit-damagecap")[0].value = attack.damagecap;
            document.getElementById(`unit-${attack_type}`).getElementsByClassName("unit-range")[0].value = attack.range;
            //this.setAttack(attack_type);
        });
        this.createXMLEditor()
        this.bindToDocument();

    }

    bindToDocument() {
        bindStrings(string_id_types, this);

        document.getElementById("unit-id").onchange = (() => { this.setUnitID(); });
        document.getElementById("unit-name").onchange = (() => { this.setName(); });

        ["food", "gold", "wood", "trade"].forEach(resource => {
            document.getElementById(`unit-${resource}-cost`).onchange = (() => { this.setCost(resource); });
        });

        document.getElementById("unit-age").onchange = (() => { this.setAge(); });
        document.getElementById("unit-hp").onchange = (() => { this.setHP(); });
        document.getElementById("unit-adjusted-hp").onchange = (() => { this.setAsjustedHP(); });

        document.getElementById("unit-population").onchange = (() => { this.setNumber("unit-population"); });
        document.getElementById("unit-train-time").onchange = (() => { this.setNumber("unit-train-time"); });
        document.getElementById("unit-limit").onchange = (() => { this.setNumber("unit-limit", "inf"); });
        document.getElementById("unit-los").onchange = (() => { this.setNumber("unit-los"); });

        document.getElementById("unit-armor").onchange = (() => { this.setArmor(); });
        document.getElementById("unit-armor-type").onchange = (() => { this.setArmorType(); });
        document.getElementById("unit-speed").onchange = (() => { this.setSpeed(); });
        //document.getElementById("unit-speed").onchange = (() => { this.setNumber("unit-speed", '-', true); });

        ["melee", "ranged", "siege", "cannon"].forEach(attack_type => {
            document.getElementById(`unit-${attack_type}-attack`).onchange = (() => { this.setAttack(attack_type); });
            document.getElementById(`unit-${attack_type}-rof`).onchange = (() => { this.setAttack(attack_type); });
            document.getElementById(`unit-${attack_type}`).getElementsByClassName("unit-damagearea")[0].onchange = (() => { this.setAttack(attack_type); });
            document.getElementById(`unit-${attack_type}`).getElementsByClassName("unit-damagecap")[0].onchange = (() => { this.setAttack(attack_type); });
            document.getElementById(`unit-${attack_type}`).getElementsByClassName("unit-range")[0].onchange = (() => { this.setAttack(attack_type); });
        });
    }

    updateXML() {
        if(!preferences["xml-editing"])
            return;
        this.setXMLValue("buildlimit", this.limit, "los");
        this.setXMLValue("trainpoints", this.train_time, "los");
        this.setXMLValue("populationcount", this.population, "editornameid");
        this.xml.find("los")[0].textContent = this.los;

        this.updateXMLEditor();
    }

    setXMLValue(tag_name, value, after_tag, is_string=false, xml=this.xml) {
        if((!is_string && (isNaN(value) || value == 0)) || 
            (is_string && value == '')) {
            xml.find(tag_name).remove();
        }
        else {
            if(xml.find(tag_name).length === 0) {
                let build_limit = xmlDoc.createElement(tag_name);
                build_limit.textContent = value;
                xml.find(after_tag).after(build_limit);
            }
            else
                xml.find(tag_name)[0].textContent = value;
        }
    }

    createXMLEditor() {
        if(!preferences["xml-editing"])
            return;
        document.getElementById("unit-xml").getElementsByTagName("code")[0].innerHTML = '';
        this.unit_xml_editor = CodeMirror(document.getElementById("unit-xml").getElementsByTagName("code")[0], {
            value: prettyPrintXML(this.xml[0].outerHTML),
            mode: "xml"
        });
        //document.getElementById("unit-xml").getElementsByTagName("code")[0].textContent = `<unit id="${this.id}" name="${this.name}">${this.xml.html().toString()}</unit>`; //.replace(/</g, '&lt;').replace(/>/g, '&rt;');
        //hljs.highlightBlock(document.getElementById("unit-xml").getElementsByTagName("code")[0]);
    }

    updateXMLEditor() {
        if(this.unit_xml_editor != undefined && preferences["xml-editing"])
            this.unit_xml_editor.setValue(prettyPrintXML(this.xml[0].outerHTML));
    }

    getUpgrades() {
        let name = this.name;
        document.getElementById("unit-upgrades").innerHTML = '';
        let upgrades = $techs.find(`tech:contains("UpgradeTech")>effects>effect[subtype="Hitpoints"]>target[type="ProtoUnit"]:contains("${name}")`).filter( 
            function () { return ($(this).text() == name);}
        ).parents("tech").not('[name^="HC"]');
        this.upgrades = {};
        for (const u of upgrades) {
            let upgrade = new Tech(u);
            this.upgrades[upgrade.element_name] = upgrade;
            document.getElementById("unit-upgrades").innerHTML += upgrade.render();
        }
        for (const tech_element in this.upgrades) {
            if (this.upgrades.hasOwnProperty(tech_element)) {
                this.upgrades[tech_element].bindToDocument();
            }
        }
    }

    getAdjustedAttack() {
        let adjusted_attack = 0;
        let weight = 0;
        let specialization = 0;
        //console.log(`____________________________________\nAdjusted attacks:`)
        adjustment_units.forEach(enemy => {
            let current_adjusted_attack = 0;
            let current_specialization = 0;
            let current_weight = 0;
            for (const attack_type in this.main_attacks) {
                if (this.main_attacks.hasOwnProperty(attack_type) && this.main_attacks[attack_type].damage > 0) {
                    const attack = this.main_attacks[attack_type];
                    let damage = attack.damage;
                    if(attack.damagecap > 0) {
                        damage = (damage + attack.damagecap) / 2
                    }
                    switch (enemy.type) {
                        case "ranged":
                            switch (attack_type) {
                                case "melee":
                                    current_adjusted_attack += 0.2 * (0.75 * getMultiplier(attack, enemy) + 0.25) * damage / attack.rof;
                                    current_specialization += 0.2 * (getMultiplier(attack, enemy) - 1) ** 2;
                                    current_weight += 0.3;
                                    break;
                                case "ranged":
                                case "cannon":
                                    current_adjusted_attack += 0.8 * (0.75 * getMultiplier(attack, enemy) + 0.25) * damage / attack.rof;
                                    current_specialization += 0.8 * (getMultiplier(attack, enemy) - 1) ** 2;
                                    current_weight += 0.7;
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case "melee":
                            switch (attack_type) {
                                case "ranged":
                                case "melee":
                                case "cannon":
                                    current_adjusted_attack += (0.75 * getMultiplier(attack, enemy) + 0.25) * damage / attack.rof;
                                    current_specialization += (getMultiplier(attack, enemy) - 1) ** 2;
                                    current_weight += 1;
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case "building":
                            switch (attack_type) {
                                case "siege":
                                case "cannon":
                                    current_adjusted_attack += (0.75 * getMultiplier(attack, enemy) + 0.25) * damage / attack.rof;
                                    current_specialization += (getMultiplier(attack, enemy) - 1) ** 2;
                                    current_weight += 1;
                                    break;
                                default:
                                    break;
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
            if(current_weight > 0) {
                adjusted_attack += current_adjusted_attack * enemy.weight / current_weight;
                specialization += current_specialization * enemy.weight / current_weight;
                weight += enemy.weight;
                //console.log(enemy.name);
                //console.log(Math.round(current_adjusted_attack * 3 / current_weight));
                //console.log(`Specialization: ${current_specialization / current_weight}`);
            }
        });
        this.adjusted_attack = adjusted_attack * 3 / weight;
        this.specialization = Math.min(100, Math.round(10 * Math.sqrt(specialization / weight)));
        this.getEfficiency();
        return(Math.round(this.adjusted_attack));
    }
    getEfficiency() {
        this.efficiency = Math.round(450 * (
                (Math.sqrt(
                    this.adjusted_attack * (Math.max(10, this.adjusted_hp - 100)) * (1 + this.specialization)
                ) + 30 * (this.speed - 3) + 5 * (this.los - 10)) / (this.total_cost ** 2)
            ) ** 0.3 ) / 100;
        document.getElementById("unit-efficiency").textContent = this.efficiency;
    }
    setCost(resource) {
        this[`${resource}_cost`] = parseInt(document.getElementById([`unit-${resource}-cost`]).value);
        this.total_cost = Math.round(10 * this.population + this.food_cost + this.wood_cost + this.gold_cost + 400 * this.trade_cost / 290);
        if (this[`${resource}_cost`] > 0) {
            document.getElementById(`unit-${resource.toLowerCase()}-tag`).style.opacity = 0.9;
            document.getElementById(`unit-${resource.toLowerCase()}`).style.opacity = 0.9;
        }
        else {
            document.getElementById(`unit-${resource.toLowerCase()}-tag`).style.opacity = 0.5;
            document.getElementById(`unit-${resource.toLowerCase()}`).style.opacity = 0.5;
        }
        this.getEfficiency();
        document.getElementById("unit-total-cost").textContent = this.total_cost;
        let resource_upper = resource.slice(0, 1).toUpperCase() + resource.slice(1);
        if(this[`${resource}_cost`] > 0 && this.xml.find(`cost[resourcetype="${resource_upper}"]`).length === 0) {
            let cost_element = xmlDoc.createElement("cost");
            cost_element.textContent = this[`${resource}_cost`];
            cost_element.setAttribute("resourcetype", resource_upper);
            this.xml.find("buildbounty").after(cost_element);
        }
        else
            this.setXMLValue(`cost[resourcetype="${resource_upper}"]`, this[`${resource}_cost`], "buildbounty");
        this.setXMLValue("bounty", parseInt((this.food_cost+this.wood_cost+this.gold_cost+this.trade_cost + 5) / 10), "unitaitype");
        this.setXMLValue("buildbounty", parseInt((this.food_cost+this.wood_cost+this.gold_cost+this.trade_cost + 5) / 10), "bounty");
        this.updateXMLEditor();
    }
    setUnitID() {
        this.id = parseInt(document.getElementById("unit-id").value);
        if ($proto.find(`unit[id=${this.id}]`).length > 0)
            document.getElementById("unit-id-warning").classList.add("critical");
        else
            document.getElementById("unit-id-warning").classList.remove("critical")
        this.xml.attr("id", this.id)
        this.updateXMLEditor();
    }
    setName() {
        this.name = document.getElementById("unit-name").value;
        if ($proto.find(`unit[name=${this.name}]`).length > 0)
            document.getElementById("unit-name-warning").classList.add("critical");
        else
            document.getElementById("unit-name-warning").classList.remove("critical");
        let snake_case_name = camelToSnakeCase(this.name);
        this.xml.find("animfile")[0].textContent = this.file_path + snake_case_name + '\\' + snake_case_name + ".xml";
        this.setXMLValue("icon", this.file_path + snake_case_name + '\\' + snake_case_name + "_icon_128x128", "animfile", true);
        this.setXMLValue("portraiticon", this.file_path + snake_case_name + '\\' + snake_case_name + "_portrait", "animfile", true);
        this.xml.attr("name", this.name);
        this.updateXMLEditor();
    }
    setAge() {
        this.age = parseInt(document.getElementById("unit-age").value);
        this.xml.find("allowedage")[0].textContent = this.age;
        this.updateXMLEditor();
    }
    setNumber(field_name, null_value=0, is_float=false) {
        let field_name_snake_case = field_name.slice(5).replace(/-/g, '_');
        if (is_float)
            this[field_name_snake_case] = parseFloat(document.getElementById(field_name).value);
        else
            this[field_name_snake_case] = parseInt(document.getElementById(field_name).value);
        if (isNaN(this[field_name_snake_case]) || this[field_name_snake_case] == 0) {
            this[field_name_snake_case] = 0;
            document.getElementById(field_name).style.opacity = 0.5;
            document.getElementById(field_name + "-tag").style.opacity = 0.5;
            if (typeof(null_value) == "string")
                document.getElementById(field_name).type = "text";
            document.getElementById(field_name).value = null_value;
        }
        else {
            document.getElementById(field_name).style.opacity = 0.9;
            document.getElementById(field_name + "-tag").style.opacity = 0.9;
            document.getElementById(field_name).type = "number";
        }
        this.total_cost = Math.round(10 * this.population + this.food_cost + this.wood_cost + this.gold_cost + 400 * this.trade_cost / 290);
        this.updateXML();
        this.getEfficiency();
    }
    setString(string_name) {
        let string_name_snake_case = string_name.replace(/-/g, '_').slice(5);
        let string_id = parseInt(document.getElementById(string_name + "-id").value)
        this[string_name_snake_case] = document.getElementById(string_name).value;
        this[string_name_snake_case + "_id"] = string_id;

        if (string_name == "unit-display-name")
            document.getElementById("unit-main-name").textContent = this[string_name_snake_case];

        let warning = 
        checkDuplicates(string_id, this[string_name_snake_case]);

        if (getString(string_id) != '') {
            if (getString(string_id) != this[string_name_snake_case])
                warning = 1;
            else
                warning = 2;
        }

        document.getElementById(string_name + "-warning").classList.remove("warning");
        document.getElementById(string_name + "-warning").classList.remove("critical");
        switch (warning) {
            case 1:
                document.getElementById(string_name + "-warning").classList.add("critical");
                document.getElementById(string_name + "-warning").getElementsByClassName("warning-tooltip")[0].textContent = 
                    "This string is already occupied by other text. Replacing it may corrupt the game.";
                break;
            case 2:
                document.getElementById(string_name + "-warning").classList.add("warning");
                document.getElementById(string_name + "-warning").getElementsByClassName("warning-tooltip")[0].textContent = 
                    "This string ID is already in use. It is recommended to use new strings for modded content.";
                break;
            case 3:
                document.getElementById(string_name + "-warning").classList.add("critical");
                document.getElementById(string_name + "-warning").getElementsByClassName("warning-tooltip")[0].textContent = 
                    "You have already used this ID for another string";
                break;
            default:
                break;
        }
        let tag_name = string_name_snake_case.replace(/_/g, '').replace("rollover", "rollovertext") + "id";
        let prev_tag = {displaynameid: "dbid", editornameid: "displaynameid", rollovertextid: "editornameid", shortrollovertextid: "maxhitpoints"}[tag_name];
        this.setXMLValue(tag_name, string_id, prev_tag);
        this.updateXMLEditor();
    }
    setHP() {
        this.hp = parseInt(document.getElementById("unit-hp").value);
        this.adjusted_hp = parseInt(this.hp / (1 - this.armor / 2.5));
        this.getEfficiency();
        document.getElementById("unit-adjusted-hp").value = this.adjusted_hp;
        this.xml.find("maxhitpoints")[0].textContent = this.hp;
        this.xml.find("initialhitpoints")[0].textContent = this.hp;
        this.updateXMLEditor();
    }
    setAsjustedHP() {
        this.adjusted_hp = parseInt(document.getElementById("unit-adjusted-hp").value);
        this.hp = parseInt(this.adjusted_hp * (1 - this.armor / 2.5));
        this.getEfficiency();
        document.getElementById("unit-hp").value = this.hp;
        this.xml.find("maxhitpoints")[0].textContent = this.hp;
        this.xml.find("initialhitpoints")[0].textContent = this.hp;
        this.updateXMLEditor();
    }
    setSpeed() {
        this.speed = parseFloat(document.getElementById("unit-speed").value);
        this.getEfficiency();
        this.xml.find("maxvelocity")[0].textContent = this.speed;
        this.xml.find("maxrunvelocity")[0].textContent = this.speed + 2.0;
        this.updateXMLEditor();
    }
    setArmorType() {
        this.armor_type = document.getElementById("unit-armor-type").value;
        this.xml.find("armor")[0].setAttribute("type", this.armor_type);
        this.updateXMLEditor();
    }
    setArmor() {            
        this.setNumber("unit-armor", 0, true);
        this.adjusted_hp = parseInt(this.hp / (1 - this.armor / 2.5));
        document.getElementById("unit-adjusted-hp").value = this.adjusted_hp
        this.xml.find("armor")[0].setAttribute("value", this.armor);
        this.updateXMLEditor();
    }
    setAttack(attack_type) {
        let element = document.getElementById(`unit-${attack_type}`);

        this.main_attacks[attack_type].damage = parseFloat(document.getElementById(`unit-${attack_type}-attack`).value);
        this.main_attacks[attack_type].rof = parseFloat(document.getElementById(`unit-${attack_type}-rof`).value);
        this.main_attacks[attack_type].damagearea = parseFloat(element.getElementsByClassName("unit-damagearea")[0].value);
        this.main_attacks[attack_type].damagecap = parseFloat(element.getElementsByClassName("unit-damagecap")[0].value);
        this.main_attacks[attack_type].range = parseFloat(element.getElementsByClassName("unit-range")[0].value);
        
        element.getElementsByClassName("damage-bonuses")[0].innerHTML = '';
        for (const type in this.main_attacks[attack_type].multipliers) {
            if (this.main_attacks[attack_type].multipliers.hasOwnProperty(type)) {
                const multiplier = parseInt(20 * this.main_attacks[attack_type].multipliers[type]) / 20;
                let bonus_element = document.createElement("li");
                bonus_element.innerHTML = `
                    <span class="numeric unit-damage-bonus-type" style="opacity: 85%;">${multiplier}</span>
                    <span style="opacity: 80%;"> vs <span class="attribute-value unit-damage-bonus-type">${type}</span></span>`;
                element.getElementsByClassName("damage-bonuses")[0].appendChild(bonus_element);
            }
        }

        if(this.main_attacks[attack_type].damagearea == 0 || this.main_attacks[attack_type].damagecap == 0)
            element.getElementsByClassName("area-damage")[0].style.opacity = 0.4;
        else
            element.getElementsByClassName("area-damage")[0].style.opacity = 0.75;
        if(this.main_attacks[attack_type].range == 0)
            element.getElementsByClassName("attack-range")[0].style.opacity = 0.5;
        else
            element.getElementsByClassName("attack-range")[0].style.opacity = 0.9;

        document.getElementById("unit-main-attack").textContent = this.getAdjustedAttack();
        document.getElementById("unit-specialization").textContent = this.specialization + '%';

        const actions = this.xml.find("protoaction");
        const action_types = {
            "HandAttack" : "melee",
            "GuardianAttack" : "melee",
            "ChargeAttack" : "melee",
            "RangedAttack" : "ranged",
            "VolleyAttack" : "ranged",
            "BowAttack" : "ranged",
            "GrenadeAttack" : "ranged",
            "BuildingAttack" : "siege",
            "SiegeAttack" : "siege",
            "CannonAttack" : "cannon",
            "Attack" : "attacks",
            "": "other"
        };
        for (const key in actions) {
            if (actions.hasOwnProperty(key) && typeof(actions[key]) == "object") {
                const action = actions[key];
                try {
                    const name = action.getElementsByTagName("name")[0].textContent;
                    let type;
                    for (const action_type in action_types)
                        if (action_types.hasOwnProperty(action_type) && name.endsWith(action_type)) {
                            type = action_types[action_type];
                            break;
                        }
                    if(attack_type == type) {
                        action.getElementsByTagName("damage")[0].textContent = this.main_attacks[type].damage;
                        action.getElementsByTagName("rof")[0].textContent = this.main_attacks[type].rof;
                        this.setXMLValue("maxrange", this.main_attacks[type].range, "damage", false, $(action));
                        if(this.main_attacks[type].damagecap * this.main_attacks[type].damagearea == 0 || name.startsWith("Guardian")) {
                            this.setXMLValue("damagecap", 0, "rof", false, $(action));
                            this.setXMLValue("damagearea", 0, "rof", false, $(action));
                        }
                        else {
                            this.setXMLValue("damagecap", this.main_attacks[type].damagecap, "rof", false, $(action));
                            this.setXMLValue("damagearea", this.main_attacks[type].damagearea, "rof", false, $(action));
                            if(action.getElementsByTagName("damageflags")[0]?.textContent == undefined)
                                this.setXMLValue("damageflags", "Enemy", "damagearea", false, $(action));
                        }
                        if(name.startsWith("Trample")) {
                            action.getElementsByTagName("damage")[0].textContent = this.main_attacks[type].damage * 2 / 3;
                            action.getElementsByTagName("rof")[0].textContent = this.main_attacks[type].rof * 4 / 3;
                            this.setXMLValue("damagecap", 2, "rof", false, $(action));
                            this.setXMLValue("damagearea", this.main_attacks[type].damage * 2, "rof", false, $(action));
                            this.setXMLValue("damageflags", "Enemy", "damagearea", false, $(action));
                        }
                    }
/*
                    if (action.getElementsByTagName("maxrange").length)
                        protoaction["range"] = parseFloat(action.getElementsByTagName("maxrange")[0].textContent);
                    if (action.getElementsByTagName("damagearea").length) {
                        protoaction["damagearea"] = parseFloat(action.getElementsByTagName("damagearea")[0].textContent);
                        protoaction["damagecap"] = parseFloat(action.getElementsByTagName("damagecap")[0].textContent);
                    }
*/
                } catch(e) { console.log(e); }
            }
        }
        this.updateXMLEditor();

    }
}


const fileSelector = document.getElementById("file-selector");

var unit_xml;


fileSelector.addEventListener("change", (event) => {
    const fileList = event.target.files;
    for (const file of fileList) {
        if (file.name.startsWith("proto")) {
            PROTO_FILE = file;
            let proto_reader = new FileReader();
            proto_reader.onloadend = function(event) {
                let text = event.target.result;
                $proto = $( $.parseXML( text ) );
            }
            proto_reader.readAsText(PROTO_FILE);
        }
        else if (file.name.startsWith("techtree")) {
            TECHTREE_FILE = file;
            let techs_reader = new FileReader();
            techs_reader.onloadend = function(event) {
                let text = event.target.result;
                $techs = $( $.parseXML( text ) );
            }
            techs_reader.readAsText(TECHTREE_FILE);
        }
        else if (file.name.startsWith("stringtable")) {
            STRINGTABLE_FILE = file;
            let strings_reader = new FileReader();
            strings_reader.onloadend = function(event) {
                let text = event.target.result;
                $strings = $( $.parseXML( text ) );
            }
            strings_reader.readAsText(STRINGTABLE_FILE);
        }
    }
    setTimeout(function() {
        if ($proto != undefined && $techs != undefined && $strings != undefined)
            parseFiles();
        else
            setTimeout(function() {
                if ($proto != undefined && $techs != undefined && $strings != undefined)
                    parseFiles();
            }, 2000);
    }, 1000);
});

function loadUnit(event) {

    $("#loading-container")[0].style.display = "flex";
    setTimeout(function() {
        string_id_types = [
            "unit-display-name",
            "unit-editor-name",
            "unit-rollover",
            "unit-shortrollover",
        ];
        let base_unit = document.getElementById("select-base-unit").value;
        unit_xml = $proto.find(`unit[name=${base_unit}]`).clone();
        current_unit = new Unit(unit_xml);
        console.log(current_unit);
        current_unit.getAdjustedAttack();
        current_unit.render();
        current_unit.getUpgrades();
        document.getElementById("save-button").onclick = () => {
            $("#loading-container")[0].style.display = "flex";
            setTimeout(function() {
                saveChanges();
                $("#loading-container")[0].style.display = "none";
            }, 0);
        };

        $("#loading-container")[0].style.display = "none";
    }, 0);
    
    return false;
}