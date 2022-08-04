import { RenegadeXState } from "./renegadex-state.js";

class ServersTable extends Element {

  currentItem = null;
  selectedItems;
  props;
  list = [];

  this(props) {
    super.this?.(props);
    this.props = props;
  }

  itemAt(at) {
    return this.list[at];
  }
  totalItems() {
    return this.list.length;
  }
  indexOf(key) {
    return this.list.indexOf(this.list.filter((prop) => prop.key == key)[0]);
  }

  render() {
    if (this.currentItem && this.list.filter((prop) => prop.key == this.currentItem).length != 1) {
      this.currentItem = undefined;
      this.post(new Event("input", { bubbles: true }));
    }
    let list = [];
    let totalItems = this.totalItems();
    let { currentItem, selectedItems } = this;

    for (let index = 0; index <= totalItems; ++index) {
      let item = this.itemAt(index);
      if (item) list.push(this.renderItem(item, item.key === currentItem, selectedItems?.has(item)));
    }
    return this.renderList(list);
  }

  componentDidMount() {
    if (globalThis.server_list === undefined) {
      this.list = [];
    } else {
      this.componentUpdate({ list: globalThis.server_list.get_servers() });
    }
    globalThis.callback_service.subscribe("servers", this, this.callback);
    globalThis.callback_service.subscribe("game_running", this, this.callbackLauncher);
  }

  callbackLauncher(gameState) {
    globalThis.gameState = gameState;
    this.componentUpdate({ gameState });
  }
  callback(data) {
    this.componentUpdate({ list: data });
  }

  componentWillUnmount() {
    globalThis.callback_service.unsubscribe("servers", this, this.callback);
  }

  handleLaunchServer() {
    if(globalThis.game_running){
      return;
    }
    globalThis.renegade_x_state.launch_to_server(this.currentItem);
  }

  renderList(items) {
    return <table class="servers" {...this.props}>
        <thead>
          <tr>
            <th class="locked"></th>
            <th sortable="Name" order={this.getOrderOf("Name")}>Server Name</th>
            <th sortable="Current Map" order={this.getOrderOf("Current Map")}>Map</th>
            <th sortable="Players" order={this.getOrderOf("Players")}>Players</th>
            <th sortable="Latency" order={this.getOrderOf("Latency")}>Ping</th>
          </tr>
        </thead>
        <tbody>
          {items}
        </tbody>
      </table>;
  }

  getOrderOf(key) {
    if (globalThis.server_list.sortBy != key || globalThis.server_list.sortOrder == "")
      return "";
    return globalThis.server_list.sortOrder == "Ascending" ? "ascend" : "descend";
  }

  ["on click at th[sortable]"](evt, target) {
    globalThis.server_list.sort_by(target.getAttribute("sortable"));
  }

  renderItem(item, isCurrent, isSelected) {
    var classes = "";
    if (isCurrent) {
      classes += "current";
    }
    return <tr class={classes} key={item.key}>
        <th class={this.isLocked(item)}></th>
        <th><span style="color: #CE5135;">{item["NamePrefix"]}</span>{(item.hasOwnProperty("NamePrefix") ? " " : "") + item["Name"]}</th>
        <th>{item["Current Map"]}</th>
        <th>{item["Players"]}</th>
        <th>{item["Latency"] ?? "-"}</th>
      </tr>;
  }

  ["on click at tr[key]"](evt, target) {
    this.setCurrentOption(target);
  }

  ["on dblclick at tr[key]"](evt, target) {
    this.handleLaunchServer();
  }

  isLocked(item) {
    if (item["Variables"]["bPassworded"])
     return "locked";
    return "";
  }

  itemOfElement(element) {
    return this.itemAt(element.elementIndex);
  }

  ["on keydown"](evt) {
    switch (evt.code) {
      case "KeyDOWN":
        if (!this.currentItem) {
          this.componentUpdate({ currentItem: this.itemOfElement(0).key });
        } else {
          let index = this.indexOf(this.currentItem);
          if (++index < this.totalItems()) {
            this.componentUpdate({ currentItem: this.itemAt(index).key });
          }
        }
        break;
      case "KeyUP":
        if (!this.currentItem) {
          this.componentUpdate({ currentItem: this.itemAt(this.list.length - 1).key });
        } else {
          let index = this.indexOf(this.currentItem);
          if (--index >= 0) {
            this.componentUpdate({ currentItem: this.itemAt(index).key });
          }
        }
        break;
      case "KeyEND":
        this.currentItem = this.itemAt(this.totalItems() - 1).key;
        break;
      case "KeyHOME":
        this.currentItem = this.itemAt(0).key;
        break;
      default:
        return false;
    }
    this.post(new Event("input", { bubbles: true }));
    return true;
  }

  setCurrentOption(child) {
    if (child) {
      this.componentUpdate({ currentItem: this.itemOfElement(child).key });
      this.post(new Event("input", { bubbles: true }));
      return true;
    }
  }

  get value() {
    if (!this.currentItem) return undefined;
    return this.list[this.indexOf(this.currentItem)];
  }
}

export class ServerList extends Object {
  minimum_players = 0;
  maximum_players = 64;
  current_players = 0;

  sortBy = "Players";
  sortOrder = "Ascending";

  same_version = true;
  game_version = globalThis.game_version;

  servers = [];

  constructor() {
    super();
    console.log("creating ServerList");
    Window.this.xcall("get_servers", this.servers_callback);
  }

  refresh_servers() {
    Window.this.xcall("get_servers", this.servers_callback);
  }
  /*
  diff(obj1, obj2) {
    const result = {};
    if (Object.is(obj1, obj2)) {
        return undefined;
    }
    if (!obj2 || typeof obj2 !== 'object') {
        return obj2;
    }
    let objkeys = Object.keys(obj1 || {});
    objkeys = objkeys.concat(Object.keys(obj2 || {}).filter(key => !objkeys.includes(key)));
    objkeys.forEach(key => {
        if(typeof obj2[key] === 'object' && typeof obj1[key] === 'object') {
            const value = this.diff(obj1[key], obj2[key]);
            if (value !== undefined && Object.keys(value).length !== 0) {
                console.log("2 adding key: " + JSON.stringify(key) + ", value: " + JSON.stringify(value));
                result[key] = value;
            }
        } else if(obj2[key] !== obj1[key] && !Object.is(obj1[key], obj2[key]) && obj2[key] !== undefined) {
          console.log("1 adding: " + JSON.stringify(key) + ", value: " + JSON.stringify(obj2[key]));
          result[key] = obj2[key];
      } 
    });
    return result;
  }*/

  servers_callback(data) {
    /*
    if(globalThis.server_list.servers) {
      var obj = globalThis.server_list.diff(globalThis.server_list.servers, data);
      console.warn("servers_callback: " + JSON.stringify(obj));
    }
    */

    globalThis.server_list.servers = data;
    for(const server of data) {
      Window.this.xcall("get_ping", server["IP"] + ":" + server["Port"], globalThis.server_list.ping_callback);
    }
    globalThis.server_list.notify_subscribers();
  }

  ping_callback(key, time_response) {
    let updateServer = globalThis.server_list.servers.filter((server) => server["IP"] + ":" + server["Port"] == key)[0];
    updateServer["Latency"] = time_response;
    globalThis.server_list.notify_subscribers();
  }

  set_minimum_players(players) {
    this.minimum_players = players;
    this.notify_subscribers();
  }

  set_maximum_players(players) {
    this.maximum_players = players;
    this.notify_subscribers();
  }

  sort_by(key) {
    if(this.sortBy == key) {
      console.log("updating order from: " + this.sortOrder);
      if(this.sortOrder == "Ascending")
        this.sortOrder = "Descending";
      else if(this.sortOrder == "Descending")
        this.sortOrder = "";
      else if(this.sortOrder == "")
        this.sortOrder = "Ascending";
      else
        this.sortOrder = "Ascending";
      console.log("updating order to: " + this.sortOrder);
    } else {
      console.log("updating sortOrder");
      this.sortBy = key;
      this.sortOrder = "Ascending";      
    }
    this.notify_subscribers();
  }

  notify_subscribers() {
    globalThis.callback_service.publish("servers", this.get_servers());
  }

  is_all_versions() {
    return this.same_version;
  }

  toggle_versions() {
    this.same_version = !this.same_version;
    this.notify_subscribers();
  }

  get_servers() {
    const list = [];

    /* Example entry of this.servers
      {
        "Name": "blabla",
        "NamePrefix": "[TotemArts]",
        "Current Map": "CNC-LakeSide",
        "Bots": 1,
        "Players": 0,
        "Game Version": "5.48.145",
        "Variables": {
          "bPassworded": false,
          "bAllowPrivateMessaging": true,
          "bRanked": true,
          "Game Type": 1,
          "Player Limit": 10,
          "Vehicle Limit": 11,
          "bAutoBalanceTeams": false,
          "Team Mode": 6,
          "bSpawnCrates": true,
          "CrateRespawnAfterPickup": 35.0,
          "Time Limit": 0
        },
        "Port": 7777,
        "IP": "00.00.00.143"
      },
    */
    this.current_players = 0;
    for (const server of this.servers) {
      this.current_players += server["Players"];
      if (
        server["Players"] >= this.minimum_players &&
        server["Players"] <= this.maximum_players &&
        (!this.same_version || server["Game Version"] == this.game_version)
      ) {
        server.key = server["IP"] + ":" + server["Port"];
        list.push(server);
      }
    }
    if (this.sortOrder != "") {
      console.log(
        "Sorting server_list by " + this.sortBy + " in order " + this.sortOrder
      );
      list.sort((first, second) => {
        try {
          var sort = this.sortOrder == "Ascending" ? -1 : 1;
          if (
            first[this.sortBy] === undefined &&
            second[this.sortBy] === undefined
          )
            return 0;
          if (first[this.sortBy] === undefined) return 1;
          if (second[this.sortBy] === undefined) return -1;

          if (first[this.sortBy] > second[this.sortBy]) {
            return sort;
          }
          if (first[this.sortBy] < second[this.sortBy]) {
            return -sort;
          }
          // a must be equal to b
          return 0;
        } catch (e) {
          console.error(e);
          throw e;
        }
      });
    }
    return list;
  }
}

export class Servers extends Element {
  server_list;

  this() {
    if (globalThis.server_list === undefined)
      globalThis.server_list = new ServerList();
    this.server_list = Object.assign({}, globalThis.server_list);
    if (globalThis.renegade_x_state === undefined)
      globalThis.renegade_x_state = new RenegadeXState();
  }

  componentDidMount() {
    globalThis.callback_service.subscribe("servers", this, this.callback);
    globalThis.callback_service.subscribe("game_running", this, this.callback);
  }

  callback() {
    var server_list_clone = Object.assign({}, globalThis.server_list);
    this.componentUpdate({ server_list: server_list_clone });
  }

  componentWillUnmount() {
    globalThis.callback_service.unsubscribe("servers", this, this.callback);
  }

  render(props) {
    return (
      <div {...this.props} id="not_chat" class="join_server">
        <div class="titlebar">
          <h3 class="title">Servers</h3>
          <p class="nowrap padding" style="font-size: 7pt;">There are currently {this.server_list.current_players} players online</p>
          <div class="spacer"></div>
          Filters
          <div class="filter down"></div>
          <div class="refresh"></div>
        </div>
        <div class="filterbar">
          <p class="nowrap">Players: {this.server_list.minimum_players} - {this.server_list.maximum_players}</p>
          <Slider {...this.server_list} />
          <checkmark class={"big" + (this.server_list.same_version ? " checked" : "")} toggle /><p class="nowrap">Same version</p>
        </div>
        <div class="body mheight">
          <ServersTable />
        </div>
        <div class="titlebar">
          <h3 class="title"> <span style="color: #CE5135;">{this.selectedServer && this.selectedServer["NamePrefix"] ? this.selectedServer["NamePrefix"] + " " : ""}</span> {this.selectedServer ? this.selectedServer["Name"] : "No Server Selected"}</h3>
          <div class="spacer"></div>
          <div class="dropdown_menu closed">PLAY ONLINE</div>
          <div style="position: relative;">
            <div class="menu child-padding" style="visibility: hidden;">
              <div class="padding" overlay="ip"><h4>JOIN BY IP</h4></div>
            </div>
          </div>
        </div>
        {this.renderSelectedMap()}
      </div>
    )
  }

  renderSelectedMap() {
    if (!this.selectedServer)
      return <div id="map" style="margin-bottom: 10dip;"></div>;

    let entry = this.selectedServer;
    var mapName = entry["Current Map"].split("-", 2);

    return (
      <div id="map" class="body hflow">
        <div class="expand" style="margin-right: 10px; ">
          <h3>MAP: <span style="color: #CE5135;">{mapName[1].replace("_", " ")}</span></h3>
          <div class="hflow" style=" height: *; vertical-align: bottom;">
            <div class="vflow expand child-padding">
              <p>Time Limit: <span>{entry["Variables"]["Time Limit"].toString()}</span></p>
              <p>Vehicle Limit: <span>{entry["Variables"]["Vehicle Limit"].toString()}</span></p>
              <p>Player Limit: <span>{entry["Variables"]["Player Limit"].toString()}</span></p>
              <p>Mine Limit: <span>{entry["Variables"]["Mine Limit"].toString()}</span></p>
              <p>Game Mode: <span>{mapName[0]}</span></p>
            </div>
            <div class="vflow expand child-padding">
              <p><checkmarknoinput class={ entry["Variables"]["bSpawnCrates"]? "checked" : ""} id="crates" /> Crates</p>
              <p><checkmarknoinput class={ entry["Variables"]["bSteamRequired"]? "checked" : ""} id="steam" /> Steam Required</p>
              <p><checkmarknoinput class="checked" id="ranked" /> Ranked</p>
              <p><checkmarknoinput class={ entry["Variables"]["bAutoBalanceTeams"]? "checked" : ""} id="balance" /> Auto Balance</p>
              <p><checkmarknoinput class="" id="infantry" /> Infantry Only</p>
            </div>
          </div>
          <button class="green" id="launch_server" style="bottom: 0px;" disabled={globalThis.gameState}>
            JOIN SERVER
          </button>
        </div>
        <video id="map_video" src={Window.this.xcall("get_video_location", entry["Current Map"])} loop />
      </div>
    );
  }

  ["on click at div.dropdown_menu"](evt, target) {
    target.classList.toggle("open");
    target.classList.toggle("closed");
    document.$("div.menu").style["visibility"] = target.classList.contains(
      "closed"
    )
      ? "collapse"
      : "visible";
  }

  ["on click at div.refresh"](evt, target) {
    globalThis.server_list.refresh_servers();
  }

  ["on click at div.filter"](evt, target) {
    var spoiler = this.$("div.filterbar");
    if (spoiler.style["visibility"] == "collapse") {
      spoiler.style["visibility"] = "visible";
    } else if (spoiler.style["visibility"] == "visible") {
      spoiler.style["visibility"] = "collapse";
    }
  }

  ["on click at div.filterbar checkmark"](evt, target) {
    try {
      globalThis.server_list.toggle_versions();
    } catch (e) {
      console.error(e);
    }
  }
  ["on click at #launch_server"](evt, target) {
    if(globalThis.game_running){
      return;
    }

    let { key } = this.selectedServer;
    if (key === undefined || key === null) {
      return;
    }

    globalThis.renegade_x_state.launch_to_server(key);
  }
  
  ["on input"](evt, target) {
    if (this.$("#map.hidden")) {
      this.$("#map.hidden").classList.toggle("hidden");
    }
    this.componentUpdate({ selectedServer: target.value });
  }
}

class Slider extends Element {
  render(props) {
    return <div class="slider">
      <div class="filler" style={ "width: " + props.minimum_players + "*"} />
      <div class="handle start"></div>
      <div class="range" style={ "width: " + (props.maximum_players - props.minimum_players) + "*"}></div>
      <div class="handle end"></div>
      <div class="filler" style={ "width: " + (64 - props.maximum_players) + "*"}/>
    </div>
  }

  ["on mousedown at .handle"](evt, target) {
    try {
      this.state.capture(true);
      console.log("mousedown");
      this.handle = target;
    } catch (e) {
      console.error(e);
    }
  }

  ["on mouseup"](evt, target) {
    try {
      this.handle = undefined;
      this.state.capture(false);
      console.log("mouseup");
    } catch (e) {
      console.error(e);
    }
  }

  ["on mousemove"](evt, target) {
    try {
      if (this.handle) {
        var players = Math.round(
          (evt.x / this.state.box("width", "inner")) * 64
        );
        var start = this.handle.classList.contains("start");
        if (start) {
          if (players >= globalThis.server_list.maximum_players)
            players = globalThis.server_list.maximum_players - 1;
          if (players < 0) players = 0;
          globalThis.server_list.set_minimum_players(players);
        } else {
          if (players <= globalThis.server_list.minimum_players)
            players = globalThis.server_list.minimum_players + 1;
          if (players > 64) players = 64;
          globalThis.server_list.set_maximum_players(players);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}
