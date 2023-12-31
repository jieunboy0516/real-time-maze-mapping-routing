//region of the maze
var mazeregion = {
  topleft: [0, 400],
  topright: [400, 400],
  bottomleft: [0, -400],
  bottomright: [400, -400],
};

//domain of both axis
let domainsize = 400;

// set the dimensions and margins of the graph
var margin = { top: 10, right: 10, bottom: 10, left: 10 },
  width = 1900 - margin.left - margin.right,
  height = 900 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svG = d3
  .select("#scatter_area")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  .attr("color", "#e6e8ea") // font color
  .attr("font-weight", "bold") // we are bold enough to do this
  .attr("stroke-width", 2); // and even this

// Create data
var data = [
  { x: 10, y: 20 },
  { x: 40, y: 90 },
  { x: 80, y: 50 },
];

// X scale and Axis
let xdomain = [-domainsize, domainsize];
let ydomain = [-domainsize, domainsize];
var x = d3
  .scaleLinear()
  .domain(xdomain) // This is the min and the max of the data: 0 to 100 if percentages
  .range([0, width]); // This is the corresponding value I want in Pixel
var xaxis = svG
  .append("g")
  .attr("transform", "translate(0," + height / 2 + ")")
  //.attr("transform", "translate(0," + height + ")")
  .style("opacity", 0.25)
  .call(d3.axisBottom(x));

// X scale and Axis
var y = d3
  .scaleLinear()
  .domain(ydomain) // This is the min and the max of the data: 0 to 100 if percentages
  .range([height, 0]); // This is the corresponding value I want in Pixel
var yaxis = svG
  .append("g")
  .attr("transform", "translate(" + width / 2 + ",0)")
  //.attr("transform", "translate(0,0)")
  .style("opacity", 0.2)
  .call(d3.axisLeft(y));

//testing for a circle and a line
// svG
//   .append("circle")
//   .attr("cx", function (d) {
//     //console.log(x(d.x));
//     return x(50);
//   })
//   .attr("cy", function (d) {
//     return y(80);
//   })
//   .attr("r", 15);

var lastpos = [50, 80];

// svG
//   .append("line")
//   .style("stroke", "lightgreen")
//   .style("stroke-width", 5)
//   .attr("x1", 0)
//   .attr("y1", 0)
//   .attr("x2", x(lastpos[0]))
//   .attr("y2", y(lastpos[1]));

lastpos = [0, 0];

var minimumdistancetolastpos = 2.3;

var lastwallpos = [0, 0];
var direction = ["leftright", "updown"];
var wallmargin = 4;
let initwallmarign = 1;
var drawWall = true;
var followingwallwaslastnone = true;
var enteringwallnone = false; //means the option just get swtiched to none
//added because otherwise the moment the option is switched to none, a wall line is drawn
var allloops = [];
var currentloop = [];

// Add 3 dots for 0, 50 and 100% for testing
svG
  .selectAll("whatever")
  .data(data)
  .enter()
  .append("circle")
  .attr("cx", function (d) {
    return x(d.x);
  })
  .attr("cy", function (d) {
    return y(d.y);
  })
  .attr("r", 2)
  .attr("opacity", "0");

var socket = io();
function testsocket() {
  console.log(socket);
}

var isFirst = true; //only called in the first time so that i can set the lastwallpos correctly

let allmyfuckingpoints = []; //each
let unreachablepts = [];

function ReceivednewBall(msg) {
  console.log("msg", msg);

  var _x = Number(msg[0]);
  var _y = Number(msg[1]);
  var followingwall = msg[2];

  if (_x == lastpos[0] && _y == lastpos[1]) return;

  //do not add the point if it is too close to the last point
  if (
    allmyfuckingpoints.length > 1 &&
    distance(
      { x: _x, y: _y },
      allmyfuckingpoints[allmyfuckingpoints.length - 1]
    ) < minimumdistancetolastpos
  ) {
    //console.log("rejected");
    return; // dont do anything if too close
  }

  allmyfuckingpoints.push({
    x: _x,
    y: _y,
    cluster: null,
  });
  currentloop.push({
    x: _x,
    y: _y,
  });

  if (_x >= lastpos[0]) direction[0] = "right";
  if (_x < lastpos[0]) direction[0] = "left";
  if (_y >= lastpos[1]) direction[1] = "up";
  if (_y < lastpos[1]) direction[1] = "down";

  let angle = Math.abs(
    Math.atan(Math.abs(_y - lastpos[1]) / Math.abs(_x - lastpos[0]))
  );
  if (_x == lastpos[0]) angle = Math.PI / 2; //if it is vertical move then set the angle to 90 degree

  if (isFirst) {
    if (direction[0] == "right") {
      if (direction[1] == "up") lastwallpos = [0, initwallmarign];
      if (direction[1] == "down") lastwallpos = [initwallmarign, 0];
    }
    if (direction[0] == "left") {
      if (direction[1] == "up") lastwallpos = [-initwallmarign, 0];
      if (direction[1] == "down") lastwallpos = [0, -initwallmarign];
    }

    //set the lastpos for the joined line for scatters so that it doesnt always start as 0,0
    lastpos = [_x, _y];
  }

  var data = [{ x: _x, y: _y }];
  //add the scatter
  svG
    .selectAll("whatever")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "mydatapoint")
    .style("z-index", 7)
    .attr("cx", function (d) {
      //console.log(x(d.x));
      return x(d.x);
    })
    .attr("cy", function (d) {
      return y(d.y);
    })
    .attr("r", 1.8);

  //connect the scatter with a fucking line
  var checkboxshowscatterline = document.getElementById(
    "checkboxshowscatterline"
  );
  svG
    .append("line")
    .attr("class", "scatterline")
    .style("stroke", "lightgreen")
    .style("stroke-width", 1.5)
    .style("display", checkboxshowscatterline.checked ? "block" : "none")
    .attr("x1", x(lastpos[0]))
    .attr("y1", y(lastpos[1]))
    .attr("x2", x(_x))
    .attr("y2", y(_y));

  lastpos = [_x, _y];

  //draw the fucking wall
  if (drawWall && !enteringwallnone && !(followingwall == "none")) {
    let start = []; //actually this part poorly coded but no fucks given

    if (followingwallwaslastnone) {
      followingwallwaslastnone = false;
      start = [_x, _y]; //if the shit just started to loop set the start of the wall to itself so
    } else {
      start = [lastwallpos[0], lastwallpos[1]];
    }

    let dest = [100, 1000]; //random value
    console.log(direction);

    //if we are following left
    if (followingwall == "left") {
      if (direction[0] == "right") {
        if (direction[1] == "up")
          dest = [
            _x - wallmargin * Math.sin(angle),
            _y + wallmargin * Math.cos(angle),
          ];
        if (direction[1] == "down")
          dest = [
            _x + wallmargin * Math.sin(angle),
            _y + wallmargin * Math.cos(angle),
          ];
      }
      if (direction[0] == "left") {
        if (direction[1] == "up")
          dest = [
            _x - wallmargin * Math.sin(angle),
            _y - wallmargin * Math.cos(angle),
          ];
        if (direction[1] == "down")
          dest = [
            _x + wallmargin * Math.sin(angle),
            _y - wallmargin * Math.cos(angle),
          ];
      }
    }

    //if we are following right
    if (followingwall == "right") {
      if (direction[0] == "right") {
        if (direction[1] == "up")
          dest = [
            _x + wallmargin * Math.sin(angle),
            _y - wallmargin * Math.cos(angle),
          ];
        if (direction[1] == "down")
          dest = [
            _x - wallmargin * Math.sin(angle),
            _y - wallmargin * Math.cos(angle),
          ];
      }
      if (direction[0] == "left") {
        if (direction[1] == "up")
          dest = [
            _x + wallmargin * Math.sin(angle),
            _y + wallmargin * Math.cos(angle),
          ];
        if (direction[1] == "down")
          dest = [
            _x - wallmargin * Math.sin(angle),
            _y + wallmargin * Math.cos(angle),
          ];
      }
    }

    //draw the wall

    var checkboxshowwall = document.getElementById("checkboxshowwall");
    if (!isFirst) {
      svG
        .append("line")
        .attr("class", "wallline")
        .style("display", checkboxshowwall.checked ? "block" : "none")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("x1", x(start[0]))
        .attr("y1", y(start[1]))
        .attr("x2", x(dest[0]))
        .attr("y2", y(dest[1]));
    }

    console.log("start", lastwallpos);
    console.log("dest", dest);
    lastwallpos = dest;

    console.log("wall added");
  }

  enteringwallnone = false; //after the first time exiting from none, we will start drawing wall

  isFirst = false; // not the first time anymore

  if (followingwall != "none") {
    detectclosedloop({
      x: _x,
      y: _y,
    });
  }
}

socket.on("sendyouball", (msg) => ReceivednewBall(msg));
socket.on("rover_current_coords", (msg) => ReceivednewBall(msg));

/// for my fucking button

function getrawdataclicked() {
  let myinterval = setInterval(function () {
    if (isMouseHover) {
      socket.emit("needball", "Asdad");
    } else {
      clearInterval(myinterval);
    }
  }, 100);
}

function getblurreddataclicked() {
  let myinterval = setInterval(function () {
    if (isMouseHover2) {
      socket.emit("needbigball", "Asdad");
    } else {
      clearInterval(myinterval);
    }
  }, 100);
}

let isMouseHover = false;
let test = document.getElementById("mybutton");
test.addEventListener(
  "mouseleave",
  function (event) {
    isMouseHover = false;
    event.target.textContent = "Get raw data";
    //console.log(isMouseHover)
  },
  false
);
test.addEventListener(
  "mouseover",
  function (event) {
    isMouseHover = true;
    event.target.textContent = "Getting";
    //console.log(isMouseHover)
  },
  false
);

let isMouseHover2 = false;
let test2 = document.getElementById("mybutton2");
test2.addEventListener(
  "mouseleave",
  function (event) {
    isMouseHover2 = false;
    event.target.textContent = "Get blurred data";
    //console.log(isMouseHover)
  },
  false
);
test2.addEventListener(
  "mouseover",
  function (event) {
    isMouseHover2 = true;
    event.target.textContent = "Getting";
    //console.log(isMouseHover)
  },
  false
);

//my k mean clustering shit

var centroids = null;
var color = d3.scaleOrdinal(d3.schemeCategory10); // 10 different colors for 10 different numbers
var centroidsSvg = null;

const getRandomPoint = () => {
  const point = {
    x: Math.random() * (xdomain[1] - xdomain[0]) + xdomain[0],
    y: Math.random() * (ydomain[1] - ydomain[0]) + ydomain[0],
    cluster: null,
  };

  return point;
};
const generatePoints = (n) => {
  // generate an array of n random points
  return Array.from(Array(n)).map((_) => getRandomPoint());
};

const distance = (a, b) => {
  // Euclidean distance in 2D
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
};

const closestCentroid = (point) => {
  const distances = centroids.map((centroid) => distance(point, centroid)); // distance to each centroid
  const i = distances.findIndex((d) => d === Math.min(...distances)); // index of the closest centroid
  return i;
};

const updatePoints = () => {
  allmyfuckingpoints.forEach((point) => {
    point.cluster = closestCentroid(point);
  });
  // pointsSvg
  //   .transition()
  //   .duration(500)
  //   .style("fill", (d) => color(d.cluster));
};

const avg = (arr) => arr.reduce((p, c) => p + c, 0) / arr.length; // average of a numeric array
const updateCentroids = () => {
  centroids.forEach((centroid, i) => {
    const cluster = allmyfuckingpoints.filter((point) => point.cluster === i); // all points in the cluster
    if (cluster.length > 0) {
      centroid.x = avg(cluster.map((point) => point.x)); // calculate average position
      centroid.y = avg(cluster.map((point) => point.y));
    }
  });
  centroidsSvg
    .transition()
    .duration(50)
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y)); // update centroid position
};

//updatePoints(); // assign the initial cluster

var oldKmeanTask = null;

function kmeanallmyfuckingpoints(numClusters) {
  //if oldmeanTask is not null clearinterval
  if (oldKmeanTask != null) {
    clearInterval(oldKmeanTask);
  }

  //remove all previous centroid
  d3.selectAll(".centroid").remove();

  centroids = generatePoints(numClusters);

  centroidsSvg = svG
    .append("g")
    .attr("id", "centroids-svg")
    .raise()
    .selectAll("dot")
    .data(centroids)
    .enter()
    .append("circle")
    .attr("class", "centroid")
    .style("display", "block")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", 2.5) // a bit bigger than data points
    .style("fill", "#EE4B2B") // greyish fill
    .style("z-index", 10)
    .attr("stroke", function (d, i) {
      color(i);
      //console.log(color(i));
    }) // and a thick colorful outline
    .attr("stroke-width", 2)
    .on("mouseover", function (d, i) {
      d3.select("#currentclusterindex").text(`Hovered Cluster index: ${i}`);
      d3.select("#centroids-svg").raise();
    });

  setInterval(() => {
    updateCentroids();
    updatePoints();

    //detect empty cluster
    centroids.forEach((centroid, i) => {
      let cluster = allmyfuckingpoints.filter((point) => point.cluster === i); // all points in the cluster
      if (cluster.length <= 0) {
        //console.log(`cluster ${i} is empty`);

        //generate a random point within the domain or the mazeregion
        // centroid.x = Math.random() * (xdomain[1] - xdomain[0]) + xdomain[0];
        // centroid.y = Math.random() * (ydomain[1] - ydomain[0]) + ydomain[0];
        centroid.x =
          Math.random() * (mazeregion.topright[0] - mazeregion.topleft[0]) +
          mazeregion.topleft[0];
        centroid.y =
          Math.random() * (mazeregion.topleft[1] - mazeregion.bottomleft[1]) +
          mazeregion.bottomleft[1];

        //console.log("unemptied", cluster);

        //update the centroids' positions so that the generated random point might fit onto the data
        centroids.forEach((centroid, i) => {
          const cluster = allmyfuckingpoints.filter(
            (point) => point.cluster === i
          ); // all points in the cluster
          if (cluster.length > 0) {
            centroid.x = avg(cluster.map((point) => point.x)); // calculate average position
            centroid.y = avg(cluster.map((point) => point.y));
          }
        });

        centroidsSvg
          .transition()
          .duration(50)
          .attr("cx", (d) => x(d.x))
          .attr("cy", (d) => y(d.y)); // update centroid position
      }
    });
  }, 50); // 1000ms = 1s
}

function KmeanButton() {
  //read value of input textboxkmeannumber
  var textboxkmeannumber = document.getElementById("textboxkmeannumber").value;

  kmeanallmyfuckingpoints(Number(textboxkmeannumber));
}

function cleardatapoints() {
  d3.selectAll(".mydatapoint").remove();
  d3.selectAll(".scatterline").remove();
  d3.selectAll(".wallline").remove();

  //Clear allmyfuckingpoints and allloops currentloop stuff??? not yet
}

function connnectcluster(startclusterindex, endclusterindex) {
  let clusterconnections = {};

  //fill up clusterconnecctions
  for (let i = 0; i < centroids.length; i++) {
    clusterconnections[i] = [];
  }

  //get the cluster for the 0th datapoint
  let currentcluster = closestCentroid(allmyfuckingpoints[0]);

  //loop through all datapoints
  for (let i = 1; i < allmyfuckingpoints.length; i++) {
    let temp = closestCentroid(allmyfuckingpoints[i]);
    //add to clusterconnections if we are in a different cluster now
    if (temp != currentcluster) {
      //add currentcluster to the previous cluster's array and add the previous cluster into current cluster's array too
      if (!clusterconnections[currentcluster].includes(temp))
        clusterconnections[currentcluster].push(temp);
      if (!clusterconnections[temp].includes(currentcluster))
        clusterconnections[temp].push(currentcluster);
    }
    currentcluster = temp;
  }

  console.log("cluster connections", clusterconnections);
  // console.log("cluster connections" , JSON.stringify(clusterconnections))
  // console.log("all centroids" , centroids);
  // console.log("all centroids" , JSON.stringify(centroids));

  //Apply ASTAR here
  let clustercoords = [];
  //loop through anclustercoords to prepare the correct data structure
  for (var i = 0; i < centroids.length; i++) {
    clustercoords[i] = [centroids[i].x, centroids[i].y];
  }

  Astar_and_Draw(
    clusterconnections,
    clustercoords,
    startclusterindex,
    endclusterindex
  );
}

function connectclusterbutton() {
  let textboxstartcluster = document.getElementById("textboxstartcluster");
  let textboxendcluster = document.getElementById("textboxendcluster");
  connnectcluster(
    Number(textboxstartcluster.value),
    Number(textboxendcluster.value)
  );
}

function resetcount() {
  socket.emit("resetcount", "Asdad");
}

function getfakedata() {
  socket.emit("getfakedata", "Asdad");
}

function GetClosestCluster() {
  //get value from textboxxytoclosestcluster in form of x,y
  let textboxxytoclosestcluster = document.getElementById(
    "textboxxytoclosestcluster"
  );
  let xy = textboxxytoclosestcluster.value.split(",");
  let x = Number(xy[0]);
  let y = Number(xy[1]);

  //get the closest cluster
  let closestcluster = closestCentroid({ x: x, y: y });

  alert(
    "Closest cluster is cluster " +
      closestcluster +
      " at " +
      centroids[closestcluster].x +
      "," +
      centroids[closestcluster].y
  );
}

// Following wall select *************************************

var wallselect = document.getElementById("followingwall");
// Add an event listener for the "changed" event
wallselect.addEventListener("change", function (event) {
  // Get the selected option
  var selectedOption = event.target.value;
  if (selectedOption == "none") {
    followingwallwaslastnone = true;
    enteringwallnone = true;
  }
});

//simulator******************************************************

let simulatorstep = 5;

document.addEventListener("keydown", function (event) {
  if (
    event.key === "ArrowUp" ||
    event.key === "ArrowDown" ||
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight"
  ) {
    event.preventDefault();
    //read the selected wall side

    // Get the selected option
    var selectedOption = wallselect.options[wallselect.selectedIndex];

    // Get the value of the selected option
    var selectedValue = selectedOption.value;

    //last position
    let lastpt = [
      allmyfuckingpoints[allmyfuckingpoints.length - 1].x,
      allmyfuckingpoints[allmyfuckingpoints.length - 1].y,
      selectedValue,
    ];
    if (event.key === "ArrowUp") {
      lastpt[1] += simulatorstep;
    } else if (event.key === "ArrowDown") {
      lastpt[1] -= simulatorstep;
    } else if (event.key === "ArrowLeft") {
      lastpt[0] -= simulatorstep;
    } else if (event.key === "ArrowRight") {
      lastpt[0] += simulatorstep;
    }

    ReceivednewBall(lastpt);
  }
});

/// close loop detect *******************************************

var detectionradius = 2.5; // how close 2 points are to consider the start and the end are the same
var minimumindexaway = 10; // minimum number of datapoints between currentpos and the startpos   (eg: start at 0, currenpos at 100)
var maximumarea = 6000; // if area < maximumarea then consider it as a closed unreachable loop
var minimumarea = 625;
var unreachablepointsfactor = 15; //for example if the area is 1000, there will be 1000/50 points in the closedloop

function detectclosedloop(currentpos) {
  //loop through currentloop
  for (var i = 0; i < currentloop.length; i++) {
    let target = {
      x: currentloop[i].x,
      y: currentloop[i].y,
    };

    //console.log(distance(currentpos,target))

    //currentloop.length will be the index of the currentpos (to be added to the currentloop array)
    if (
      distance(currentpos, target) < detectionradius &&
      currentloop.length - i > minimumindexaway
    ) {
      //from chatgpt
      //To calculate the area of a shape formed by a set of data points using D3.js, you can use the Shoelace formula (also known as Gauss's area formula or the surveyor's formula). The Shoelace formula calculates the signed area of a polygon defined by its vertices.

      //fix the format for d3.polygonArea (starting from i to the end of the array because i is the index of the collided point)
      let temp = [];
      //temp stores the loop but currentloop stores some points that are not in the loop
      for (let j = i; j < currentloop.length; j++) {
        temp.push([currentloop[j].x, currentloop[j].y]);
      }
      console.log("currentloop", currentloop);
      console.log("temp", temp);
      //temp.push(temp[0]);

      //calculate the area
      let looparea = Math.round(Math.abs(d3.polygonArea(temp)));
      console.log(`closed loop detected with area ${looparea}`);
      //alert(`closed loop detected with area ${looparea}`);
      changeStatus(`closed loop detected with area ${looparea}`);
      socket.emit("closedloopdetected", "asdigyasiudihuasdihuas");

      // draw the polygon and fill it with points which refers to unreachable points
      if (looparea < maximumarea && looparea > minimumarea) {
        //draw the polygon

        //example polygon format
        //    let  poly = [
        //     { x: 0.0, y: 25.0 },
        //     { x: 8.5, y: 23.4 },
        //     { x: 13.0, y: 21.0 },
        //     { x: 19.0, y: 15.5 },
        //   ];

        svG
          .append("g")
          .attr("id", "polygons")
          .selectAll("polygon")
          .data([currentloop.slice(i)]) //starting from i as the reason discussed above
          .enter()
          .append("polygon")
          .attr("class", "closedlooppolygons")
          .attr("points", function (d) {
            let pt = d
              .map(function (d) {
                return [x(d.x), y(d.y)].join(",");
              })
              .join(" ");

            //   console.log(pt)
            //   console.log(d)
            return pt;
          })
          .attr("opacity", 0.5)
          .attr("stroke", "grey")
          .attr("stroke-width", 2);

        //fill the polygon with points

        let generatedpoints = generatePointsinPolygon(
          temp,
          looparea / unreachablepointsfactor
        );

        svG
          .selectAll("whatever")
          .data(generatedpoints)
          .enter()
          .append("circle")
          .attr("class", "unreachablepoints")
          .attr("fill", "blue")
          .attr("cx", function (d) {
            //console.log(x(d.x));
            return x(d.x);
          })
          .attr("cy", function (d) {
            return y(d.y);
          })
          .attr("r", 1.8);

        unreachablepts.push(...generatedpoints);
      }

      //add currentloop to wallloops and reset currentloop
      allloops.push(currentloop);
      currentloop = [];

      // when we detected a closed loop, use A star to lead us to the cloest unexplored region
      if (document.getElementById("checkboxastartoclosestunxpolored").checked) {
        AstarToClosestUnexplored();
      }
    }
  }
}

// Checkboxs *****************************************************

//wall lines
var checkboxshowwall = document.getElementById("checkboxshowwall");
checkboxshowwall.addEventListener("change", function () {
  var walllines = document.getElementsByClassName("wallline");

  //loop through all walllines
  for (var i = 0; i < walllines.length; i++) {
    if (checkboxshowwall.checked) {
      walllines[i].style.display = "block";
    } else {
      walllines[i].style.display = "none";
    }
  }
});

//scatter lines
var checkboxshowscatterline = document.getElementById(
  "checkboxshowscatterline"
);
checkboxshowscatterline.addEventListener("change", function () {
  var scatterlines = document.getElementsByClassName("scatterline");

  //loop through all walllines
  for (var i = 0; i < scatterlines.length; i++) {
    if (checkboxshowscatterline.checked) {
      scatterlines[i].style.display = "block";
    } else {
      scatterlines[i].style.display = "none";
    }
  }
});

var checkboxshowmazebound = document.getElementById("checkboxshowmazebound");
checkboxshowmazebound.addEventListener("change", function () {
  var mazebound = document.getElementsByClassName("mazebound");

  //loop through all mazebound
  for (var i = 0; i < mazebound.length; i++) {
    if (checkboxshowmazebound.checked) {
      mazebound[i].style.display = "block";
    } else {
      mazebound[i].style.display = "none";
    }
  }
});

var checkboxshowmazegrid = document.getElementById("checkboxshowmazegrid");
checkboxshowmazegrid.addEventListener("change", function () {
  var mazegrid = document.getElementsByClassName("mazegrid");

  //loop through all mazegrid
  for (var i = 0; i < mazegrid.length; i++) {
    if (checkboxshowmazegrid.checked) {
      mazegrid[i].style.display = "block";
    } else {
      mazegrid[i].style.display = "none";
    }
  }
});

var checkboxshowpointsingrid = document.getElementById(
  "checkboxshowpointsingrid"
);
checkboxshowpointsingrid.addEventListener("change", function () {
  var pointsingrid = document.getElementsByClassName("numberofpointsingrid");

  //loop through all pointsingrid
  for (var i = 0; i < pointsingrid.length; i++) {
    if (checkboxshowpointsingrid.checked) {
      pointsingrid[i].style.display = "block";
    } else {
      pointsingrid[i].style.display = "none";
    }
  }
});

var checkboxshowclosedlooppolygons = document.getElementById(
  "checkboxshowclosedlooppolygons"
);

checkboxshowclosedlooppolygons.addEventListener("change", function () {
  var closedlooppolygons =
    document.getElementsByClassName("closedlooppolygons");

  //loop through all closedlooppolygons
  for (var i = 0; i < closedlooppolygons.length; i++) {
    if (checkboxshowclosedlooppolygons.checked) {
      closedlooppolygons[i].style.display = "block";
    } else {
      closedlooppolygons[i].style.display = "none";
    }
  }
});

var checkboxshowdatapoints = document.getElementById("checkboxshowdatapoints");
checkboxshowdatapoints.addEventListener("change", function () {
  var datapoints = document.getElementsByClassName("mydatapoint");

  //loop through all datapoints
  for (var i = 0; i < datapoints.length; i++) {
    if (checkboxshowdatapoints.checked) {
      datapoints[i].style.display = "block";
    } else {
      datapoints[i].style.display = "none";
    }
  }
});

var checkboxshowKmean = document.getElementById("checkboxshowKmean");
checkboxshowKmean.addEventListener("change", function () {
  var centroid = document.getElementsByClassName("centroid");

  //loop through all datapoints
  for (var i = 0; i < centroid.length; i++) {
    if (checkboxshowKmean.checked) {
      centroid[i].style.display = "block";
    } else {
      centroid[i].style.display = "none";
    }
  }
});

var checkboxshowAstarPath = document.getElementById("checkboxshowAstarPath");
checkboxshowAstarPath.addEventListener("change", function () {
  var astarline = document.getElementsByClassName("astarline");

  //loop through all datapoints
  for (var i = 0; i < astarline.length; i++) {
    if (checkboxshowAstarPath.checked) {
      astarline[i].style.display = "block";
    } else {
      astarline[i].style.display = "none";
    }
  }
});

// Maze Bound *****************************************************

function drawMazeBound() {
  //top wall
  svG
    .append("line")
    .attr("class", "mazebound")
    .style("display", checkboxshowmazebound.checked ? "block" : "none")
    .style("stroke", "black")
    .style("stroke-width", 1)
    .attr("x1", x(mazeregion.topleft[0]))
    .attr("y1", y(mazeregion.topleft[1]))
    .attr("x2", x(mazeregion.topright[0]))
    .attr("y2", y(mazeregion.topright[1]));

  //bottom wall
  svG
    .append("line")
    .attr("class", "mazebound")
    .style("display", checkboxshowmazebound.checked ? "block" : "none")
    .style("stroke", "black")
    .style("stroke-width", 1)
    .attr("x1", x(mazeregion.bottomleft[0]))
    .attr("y1", y(mazeregion.bottomleft[1]))
    .attr("x2", x(mazeregion.bottomright[0]))
    .attr("y2", y(mazeregion.bottomright[1]));

  //left wall
  svG
    .append("line")
    .attr("class", "mazebound")
    .style("display", checkboxshowmazebound.checked ? "block" : "none")
    .style("stroke", "black")
    .style("stroke-width", 1)
    .attr("x1", x(mazeregion.topleft[0]))
    .attr("y1", y(mazeregion.topleft[1]))
    .attr("x2", x(mazeregion.bottomleft[0]))
    .attr("y2", y(mazeregion.bottomleft[1]));

  //right wall
  svG
    .append("line")
    .attr("class", "mazebound")
    .style("display", checkboxshowmazebound.checked ? "block" : "none")
    .style("stroke", "black")
    .style("stroke-width", 1)
    .attr("x1", x(mazeregion.topright[0]))
    .attr("y1", y(mazeregion.topright[1]))
    .attr("x2", x(mazeregion.bottomright[0]))
    .attr("y2", y(mazeregion.bottomright[1]));
}

drawMazeBound();

// Maze Grids *****************************************************

let columns = 5; // number of columns
let rows = 8; // number of rows

function drawMazeGrids() {
  let maazewidth = mazeregion.topright[0] - mazeregion.topleft[0];
  let mazeheight = mazeregion.topleft[1] - mazeregion.bottomleft[1];

  let columnwidth = maazewidth / columns;
  let rowheight = mazeheight / rows;

  //draw vertical lines
  for (let i = 1; i < columns; i++) {
    svG
      .append("line")
      .attr("class", "mazegrid")
      .style("display", checkboxshowmazegrid.checked ? "block" : "none")
      .style("stroke", "black")
      .style("stroke-width", 0.7)
      .attr("x1", x(mazeregion.topleft[0] + columnwidth * i))
      .attr("y1", y(mazeregion.topleft[1]))
      .attr("x2", x(mazeregion.topleft[0] + columnwidth * i))
      .attr("y2", y(mazeregion.bottomleft[1]));
  }

  //draw horizontal lines
  for (let i = 1; i < rows; i++) {
    svG
      .append("line")
      .attr("class", "mazegrid")
      .style("display", checkboxshowmazegrid.checked ? "block" : "none")
      .style("stroke", "black")
      .style("stroke-width", 0.7)
      .attr("x1", x(mazeregion.topleft[0]))
      .attr("y1", y(mazeregion.topleft[1] - rowheight * i))
      .attr("x2", x(mazeregion.topright[0]))
      .attr("y2", y(mazeregion.topleft[1] - rowheight * i));
  }
}

drawMazeGrids();

// resize Maze Grids and Column Row*****************************************************

function resizeGrid() {
  //get value of input textboxgridbottomleft in the format X,Y
  let textboxgridbottomleft = document.getElementById(
    "textboxgridbottomleft"
  ).value;
  //get value of input textboxgridtopright in the format X,Y
  let textboxgridtopright = document.getElementById(
    "textboxgridtopright"
  ).value;
  //extract cooranates from the string
  let gridbottomleft = textboxgridbottomleft.split(",");
  let gridtopright = textboxgridtopright.split(",");

  mazeregion = {
    topleft: [parseFloat(gridbottomleft[0]), parseFloat(gridtopright[1])],
    topright: [parseFloat(gridtopright[0]), parseFloat(gridtopright[1])],
    bottomleft: [parseFloat(gridbottomleft[0]), parseFloat(gridbottomleft[1])],
    bottomright: [parseFloat(gridtopright[0]), parseFloat(gridbottomleft[1])],
  };

  //remove all mazebound and mazegrid
  d3.selectAll(".mazebound").remove();
  d3.selectAll(".mazegrid").remove();

  //redraw mazebound and mazegrid
  drawMazeBound();
  drawMazeGrids();
}

function setColumnRow() {
  // get value of input textboxcolumnrow in format column,row
  let textboxcolumnrow = document.getElementById("textboxcolumnrow").value;

  //extract column and row from the string
  let columnrow = textboxcolumnrow.split(",");

  columns = parseInt(columnrow[0]);
  rows = parseInt(columnrow[1]);

  //remove all mazegrid
  d3.selectAll(".mazegrid").remove();

  //redraw mazegrid
  drawMazeGrids();
}

// find unexplored part *****************************************************

var minimum_points_explored = 10; // minimum number of points (including unreachable ones) in a region to be considered explored
var closest_unexplored_region = null; // the closest unexplored region in form of [i,j]

function findUnexploredPart() {
  let maazewidth = mazeregion.topright[0] - mazeregion.topleft[0];
  let mazeheight = mazeregion.topleft[1] - mazeregion.bottomleft[1];

  let columnwidth = maazewidth / columns;
  let rowheight = mazeheight / rows;

  let unexploredPart = [];

  //remove all previous numbers on the grids
  d3.selectAll(".numberofpointsingrid").remove();

  //loop through all regions
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      let pointsinRegion = 0;

      //loop through allmyfuckingpoints
      for (let k = 0; k < allmyfuckingpoints.length; k++) {
        if (
          allmyfuckingpoints[k].x >= mazeregion.topleft[0] + columnwidth * i &&
          allmyfuckingpoints[k].x <
            mazeregion.topleft[0] + columnwidth * (i + 1) &&
          allmyfuckingpoints[k].y <= mazeregion.topleft[1] - rowheight * j &&
          allmyfuckingpoints[k].y > mazeregion.topleft[1] - rowheight * (j + 1)
        ) {
          pointsinRegion++;
        }
      }

      //loop through all unreachablepts
      for (let k = 0; k < unreachablepts.length; k++) {
        if (
          unreachablepts[k].x >= mazeregion.topleft[0] + columnwidth * i &&
          unreachablepts[k].x < mazeregion.topleft[0] + columnwidth * (i + 1) &&
          unreachablepts[k].y <= mazeregion.topleft[1] - rowheight * j &&
          unreachablepts[k].y > mazeregion.topleft[1] - rowheight * (j + 1)
        ) {
          pointsinRegion++;
        }
      }

      svG
        .append("text") //the +-5 is to make the text not overlap with the grid
        .attr("class", "numberofpointsingrid")
        .attr(
          "x",
          x(mazeregion.topleft[0] + columnwidth * i + columnwidth * 0.1)
        ) // X-coordinate of the text position
        .attr("y", y(mazeregion.topleft[1] - rowheight * j - rowheight * 0.1)) // Y-coordinate of the text position
        .attr("display", checkboxshowpointsingrid.checked ? "block" : "none")
        .text(pointsinRegion) // Text content
        .style("font-size", "8px") // Set the font size
        .style(
          "fill",
          pointsinRegion < minimum_points_explored ? "red" : "black"
        )
        .style("opacity", "0.45");

      //console.log("pointsinRegion", pointsinRegion);

      if (pointsinRegion < minimum_points_explored) {
        unexploredPart.push([i, j]);
      }
    }
  }

  //determine which region the last point of allmyfuckingpoints is located in (the current rover position)
  let currentregion = [0, 0]; // region of last point of allmyfuckingpoints
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      if (
        allmyfuckingpoints[allmyfuckingpoints.length - 1].x >=
          mazeregion.topleft[0] + columnwidth * i &&
        allmyfuckingpoints[allmyfuckingpoints.length - 1].x <
          mazeregion.topleft[0] + columnwidth * (i + 1) &&
        allmyfuckingpoints[allmyfuckingpoints.length - 1].y <=
          mazeregion.topleft[1] - rowheight * j &&
        allmyfuckingpoints[allmyfuckingpoints.length - 1].y >
          mazeregion.topleft[1] - rowheight * (j + 1)
      ) {
        currentregion = [i, j];
      }
    }
  }

  //return if unexplored parts is none

  if (unexploredPart.length == 0) {
    changeStatus("all explored i thn=ink");
    return;
  }

  //assistane functions to find the closest unexplored region

  function getDistance(pointA, pointB) {
    const dx = pointA[0] - pointB[0];
    const dy = pointA[1] - pointB[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  function findClosestUnexploredPart(unexploredPart, currentRegion) {
    let closestPart = null;
    let closestDistance = Infinity;

    for (const part of unexploredPart) {
      const distance = getDistance(part, currentRegion);
      if (distance < closestDistance) {
        closestPart = part;
        closestDistance = distance;
      }
    }

    return closestPart;
  }

  //draw the closest unexplored region (show the text unexplored area)

  closest_unexplored_region = findClosestUnexploredPart(
    unexploredPart,
    currentregion
  );

  svG
    .append("text") //the +-5 is to make the text not overlap with the grid
    .attr("class", "numberofpointsingrid")
    .attr(
      "x",
      x(
        mazeregion.topleft[0] +
          columnwidth * closest_unexplored_region[0] +
          columnwidth * 0.1
      )
    ) // X-coordinate of the text position
    .attr(
      "y",
      y(
        mazeregion.topleft[1] -
          rowheight * closest_unexplored_region[1] -
          rowheight * 0.4
      )
    ) // Y-coordinate of the text position
    .attr("display", checkboxshowpointsingrid.checked ? "block" : "none") //use checkboxshowpointsingrid to toggle the display
    .text("closest unexplored area") // Text content
    .style("font-size", "12px") // Set the font size
    .style("font-color", "orange")
    .style("opacity", 0.8);
}

setInterval(() => {
  //change the text of data-label to the number of allmyfuckingpoints
  document.getElementById("data-label").innerText =
    "number of data points: " + allmyfuckingpoints.length.toString();

  //find unexplored regions
  findUnexploredPart();
}, 500);

// generate random points within a polygon *****************************************************

function generatePointsinPolygon(polygonVertices, numPoints) {
  //example input
  //   // Define the polygon vertices
  //   var polygonVertices = [
  //     [100, 100],
  //     [200, 100],
  //     [200, 200],
  //     [100, 200]
  //   ];

  // Calculate the bounding box
  var minX = Math.min(...polygonVertices.map((vertex) => vertex[0]));
  var maxX = Math.max(...polygonVertices.map((vertex) => vertex[0]));
  var minY = Math.min(...polygonVertices.map((vertex) => vertex[1]));
  var maxY = Math.max(...polygonVertices.map((vertex) => vertex[1]));

  // Generate random points within the polygon
  var numPoints = 50;
  var generatedPoints = [];

  for (var i = 0; i < numPoints; i++) {
    var randomX = Math.random() * (maxX - minX) + minX;
    var randomY = Math.random() * (maxY - minY) + minY;

    // Check if the point is inside the polygon
    if (pointInPolygon([randomX, randomY], polygonVertices)) {
      generatedPoints.push({
        x: randomX,
        y: randomY,
      });
    }
  }

  return generatedPoints;
}

// Point-in-polygon algorithm
function pointInPolygon(point, polygon) {
  var x = point[0];
  var y = point[1];
  var inside = false;

  for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    var xi = polygon[i][0];
    var yi = polygon[i][1];
    var xj = polygon[j][0];
    var yj = polygon[j][1];

    var intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

// STATUS PRINT *****************************************************

d3.select("#status")
  .style("font-size", "26px")
  .html("Status: <br>Waiting for MQTT Rover data");

function changeStatus(status) {
  document.getElementById("status").innerText += "\n" + status;
}

// A Star Algorithm ***************************************************** VErSION 1 (works)

// the data needs to be in the following structure to work

// clusters = {
//   0: [2],
//   1: [2],
//   2: [0, 1, 3],
//   3: [2],
// };
// clustercoords = [
//   [0, 5],
//   [-5, 0],
//   [0, 0],
//   [5, 0],
// ];

var astar = {
  init: function (clusters) {
    grid = {};

    //loop through all clusters and create ASTAR data for them
    for (var i = 0; i < Object.keys(clusters).length; i++) {
      grid[i] = {
        f: 99999999,
        g: 99999999,
        h: 99999999,
        debug: "",
        parent: null,
      };
    }

    return grid;
    //console.log(grid);

    // for(var x = 0; x < grid.length; x++) {
    //   for(var y = ; y < grid[x].length; y++) {
    //     grid[x][y].f = ;
    //     grid[x][y].g = ;
    //     grid[x][y].h = ;
    //     grid[x][y].debug = "";
    //     grid[x][y].parent = null;
    //   }
    // }
  },
  search: function (clusters, clustercoords, start, end) {
    //start and end are numbers (0123)

    let grid = astar.init(clusters);

    var openList = [];
    var closedList = [];
    openList.push(start);

    while (openList.length > 0) {
      // Grab the lowest f(x) to process next
      var lowInd = 0;
      for (var i = 0; i < openList.length; i++) {
        if (grid[openList[i]].f < grid[openList[lowInd]].f) {
          lowInd = i;
        }
      }

      var currentNode = openList[lowInd];

      // End case -- result has been found, return the traced path
      if (clustercoords[currentNode] == clustercoords[end]) {
        var curr = currentNode;
        var ret = [];
        //let last = curr;
        while (grid[curr].parent != null) {
          //console.log(curr)
          if (ret.includes(curr)) break;
          ret.push(curr);
          // if (grid[curr].parent == last) break;
          // last = curr;
          curr = grid[curr].parent;
        }
        ret = ret.reverse();
        ret.unshift(start);
        return ret;
      }

      // Normal case -- move currentNode from open to closed, process each of its neighbors
      //remove currentNode from openList
      openList = openList.filter(
        (openlistitem) => openlistitem !== currentNode
      );
      // openList.removeGraphNode(currentNode);
      closedList.push(currentNode);
      var neighbors = astar.neighbors(clusters, currentNode);

      for (var i = 0; i < neighbors.length; i++) {
        var neighbor = neighbors[i];

        if (closedList.includes(neighbor)) {
          //|| neighbor.isWall()) { my neighbor cant be a wall
          // not a valid node to process, skip to next neighbor
          continue;
        }

        //distance between this neighbour and currentNode
        var d = astar.heuristic(
          clustercoords[currentNode],
          clustercoords[neighbor]
        );
        // g score is the shortest distance from start to current node, we need to check if
        //   the path we have arrived at this neighbor is the shortest one we have seen yet
        //var gScore = currentNode.g + 1; // 1 is the distance from a node to it's neighbor
        var gScore = grid[currentNode].g + d; // we are using d in our case, nvm i think is wrong
        var gScoreIsBest = false;

        if (!openList.includes(neighbor)) {
          // This the the first time we have arrived at this node, it must be the best
          // Also, we need to take the h (heuristic) score since we haven't done so yet

          gScoreIsBest = true;
          grid[neighbor].h = astar.heuristic(
            clustercoords[neighbor],
            clustercoords[end]
          );
          openList.push(neighbor);
        } else if (gScore < grid[neighbor].g) {
          // We have already seen the node, but last time it had a worse g (distance from start)
          gScoreIsBest = true;
        }

        if (gScoreIsBest) {
          //&& !grid[currentNode].parent == neighbor
          //console.log(currentNode, grid[currentNode].parent, neighbor, grid[currentNode].parent == neighbor )
          // Found an optimal (so far) path to this node.   Store info on how we got here and
          //  just how good it really is...
          if (grid[currentNode].parent != neighbor)
            grid[neighbor].parent = currentNode;
          //grid[neighbor].parent.push(currentNode)
          grid[neighbor].g = gScore;
          grid[neighbor].f = grid[neighbor].g + grid[neighbor].h;
          grid[neighbor].debug =
            "F: " +
            grid[neighbor].f +
            "<br />G: " +
            grid[neighbor].g +
            "<br />H: " +
            grid[neighbor].h;
        }
      }
    }

    // No result was found -- empty array signifies failure to find path
    return [];
  },
  heuristic: function (pos0, pos1) {
    // This is the Manhattan distance
    // var d1 = Math.abs(pos1.x - pos0.x);
    // var d2 = Math.abs(pos1.y - pos0.y);

    //console.log(pos1, pos0);

    // This is the Euclidean distance
    return Math.sqrt(
      Math.pow(pos1[0] - pos0[0], 2) + Math.pow(pos1[1] - pos0[1], 2)
    );
  },
  neighbors: function (clusters, node) {
    return clusters[node];
  },
};

//Draw the Astar path and send to the server if requested
var sendpathtoserver = false; //if true, send the A start solved path to the server in terms of array of coords
//used by the function "AStar to unexplored" which is executed when closed loop is detected

function Astar_and_Draw(
  clusterconnections,
  clustercoords,
  startcluster,
  endcluster
) {
  let path = astar.search(
    clusterconnections,
    clustercoords,
    startcluster,
    endcluster
  );

  if (sendpathtoserver) {
    let temp = [];
    for (var i = 0; i < path.length; i++) {
      temp.push(clustercoords[path[i]]);
    }
    socket.emit("astarpath", temp);
  }

  //remove all the lines with class astarline
  d3.selectAll(".astarline").remove();

  //loop through the path and draw lines
  for (var i = 0; i < path.length - 1; i++) {
    let start = path[i];
    let end = path[i + 1];
    let startx = centroids[start].x;
    let starty = centroids[start].y;
    let endx = centroids[end].x;
    let endy = centroids[end].y;

    //draw a line
    svG
      .append("line")
      .attr("class", "astarline")
      .style("stroke", "green")
      .style("stroke-width", 2.5)
      .attr("x1", x(startx))
      .attr("y1", y(starty))
      .attr("x2", x(endx))
      .attr("y2", y(endy));
  }
}

// Flipping axis *****************************************************

let flippedX = false;
let flippedY = false;

function flipX() {
  if (!flippedX) {
    xdomain = [domainsize, -domainsize];
    flippedX = true;
  } else {
    xdomain = [-domainsize, domainsize];
    flippedX = false;
  }
  x.domain(xdomain);

  // Redraw the axis
  xaxis.transition().call(d3.axisBottom(x));

  //for shapes and lines

  var circles = svG.selectAll("circle");
  circles
    .attr("cx", function (d) {
      return x(d.x);
    }) // Update the x-coordinate based on the new scale
    .attr("cy", function (d) {
      return y(d.y);
    }); // Update the y-coordinate based on the existing y-scale

  var lines = svG.selectAll("line[x1][x2][y1][y2]");
  lines
    .attr("x1", function () {
      var x1 = d3.select(this).attr("x1");
      return width - x1;
    })
    .attr("x2", function () {
      var x2 = d3.select(this).attr("x2");
      return width - x2;
    });

  //cant fucking flip this pieces of bitches so just remoe the polygons
  var polygons = svG.selectAll(".closedlooppolygons");
  // polygons
  //   .attr("points", function(d) {
  //     console.log("d", d)
  //     let flippedPoints = d.map(function (point) {
  //       return [width - x(point.x), y(point.y)].join(","); // Flip the x-coordinate of each point
  //     }).join(" ");
  //     console.log("flip", flippedPoints)
  //     return flippedPoints;
  //   })
  polygons.remove();
}

function flipY() {
  if (!flippedY) {
    ydomain = [domainsize, -domainsize];
    flippedY = true;
  } else {
    ydomain = [-domainsize, domainsize];
    flippedY = false;
  }
  y.domain(ydomain);

  // Redraw the y-axis
  yaxis.transition().call(d3.axisLeft(y));

  // Update the y-coordinate of circles
  var circles = svG.selectAll("circle");
  circles.attr("cy", function (d) {
    return y(d.y);
  });

  // Update the y-coordinate of lines
  var lines = svG.selectAll("line");
  lines
    .attr("y1", function () {
      var y1 = d3.select(this).attr("y1");
      return height - y1;
    })
    .attr("y2", function () {
      var y2 = d3.select(this).attr("y2");
      return height - y2;
    });

  // Update the y-coordinate of polygons
  var polygons = svG.selectAll("polygon");
  polygons.remove();
}

// adding custom unreachable points ****************************************************

var cursorX;
var cursorY;

let generationraidus = 0;
let generateunreachableNum = 2;

document.addEventListener("DOMContentLoaded", function () {
  const plotArea = document.getElementById("scatter_area");

  // Event listener for mouse move
  document.addEventListener("mousemove", function (event) {
    const plotAreaRect = plotArea.getBoundingClientRect();
    const offsetX = plotAreaRect.left + window.pageXOffset; // Adjust for plot area offset and scroll position
    const offsetY = plotAreaRect.top + window.pageYOffset; // Adjust for plot area offset and scroll position

    cursorX = event.clientX - offsetX;
    cursorY = event.clientY - offsetY;
    //console.log("Mouse cursor position:", cursorX, cursorY);
    //console.log(x.invert(cursorX), y.invert(cursorY))
    document.getElementById(
      "mousecoord-label"
    ).innerHTML = `Mouse Coordinate: ${x.invert(cursorX)}, ${y.invert(
      cursorY
    )}`;
  });

  // Event listener for key click 'a'
  let isGeneratingPoints = false;

  document.addEventListener("keyup", function (event) {
    if (event.key === "a") {
      isGeneratingPoints = false;
    }
  });

  document.addEventListener("keydown", function (event) {
    // Stop event propagation
    event.stopPropagation();

    if (!isGeneratingPoints && event.key === "a") {
      isGeneratingPoints = true;

      function generatePoints(centerX, centerY, radius, count) {
        const angleIncrement = (2 * Math.PI) / count; // Angle increment for each point
        const points = [];

        for (let i = 0; i < count; i++) {
          const angle = i * angleIncrement;
          const offsetX = Math.cos(angle) * radius; // X offset from center
          const offsetY = Math.sin(angle) * radius; // Y offset from center
          const pointX = centerX + offsetX; // X coordinate of the point
          const pointY = centerY + offsetY; // Y coordinate of the point

          points.push({ x: pointX, y: pointY });
        }

        return points;
      }

      const generatedPoints = generatePoints(
        x.invert(cursorX),
        y.invert(cursorY),
        generationraidus,
        generateunreachableNum
      );

      console.log(x.invert(cursorX), y.invert(cursorY));
      //console.log(generatedPoints);

      svG
        .selectAll("whatever")
        .data(generatedPoints)
        .enter()
        .append("circle")
        .attr("class", "unreachablepoints")
        .attr("fill", "blue")
        .attr("cx", function (d) {
          //console.log(x(d.x));
          return x(d.x);
        })
        .attr("cy", function (d) {
          return y(d.y);
        })
        .attr("r", 2);

      unreachablepts.push(...generatedPoints);
    }
  });
});

// Print A star to the closest unexplored point ****************************************************

var kmeancluster_datapointsNum_ratio = 0.4;

async function WaitForKMean() {
  let HasEmptycluster = false;
  while (true) {
    await new Promise((resolve) => {
      setTimeout(() => resolve(), 0); // Introduce a pause (0ms delay) to allow other tasks to run
    });

    centroids.forEach((centroid, i) => {
      let cluster = allmyfuckingpoints.filter((point) => point.cluster === i); // all points in the cluster
      if (cluster.length <= 0) {
        HasEmptycluster = true;
      }
    });

    if (HasEmptycluster) {
      HasEmptycluster = false;
    } else {
      break; // Break if no empty clusters anymore
    }
  }
}

async function AstarToClosestUnexplored() {
  if (closest_unexplored_region == null) return;

  //wait for Kmean to finish
  kmeanallmyfuckingpoints(
    Math.round(allmyfuckingpoints.length * kmeancluster_datapointsNum_ratio)
  );

  //stop moving !!
  changeStatus("stop moving, finding Route to the closest unexplored region");

  //detect empty cluster
  await WaitForKMean();

  //current pos
  let currentpos = allmyfuckingpoints[allmyfuckingpoints.length - 1];
  let currentcentroid_index = closestCentroid(currentpos);

  //calculate closest unexplored cluster
  let maazewidth = mazeregion.topright[0] - mazeregion.topleft[0];
  let mazeheight = mazeregion.topleft[1] - mazeregion.bottomleft[1];

  let columnwidth = maazewidth / columns;
  let rowheight = mazeheight / rows;

  let targetgridmidpt = {
    //grid mid point of target position
    x:
      mazeregion.topleft[0] +
      closest_unexplored_region[0] * columnwidth +
      columnwidth / 2,
    y:
      mazeregion.topleft[1] -
      closest_unexplored_region[1] * rowheight -
      rowheight / 2,
  };

  //draw a circle on that target grid md pt
  svG
    .selectAll("whatever")
    .data([targetgridmidpt])
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return x(d.x);
    })
    .attr("cy", function (d) {
      return y(d.y);
    })
    .attr("r", 3)
    .attr("opacity", "0.8")
    .attr("class", "targetgridmidpt")
    .style("fill", "pink");

  let closest_unexplored_centroid_index = closestCentroid(targetgridmidpt);

  console.log("current cluster", currentcentroid_index);
  console.log("target cluster", closest_unexplored_centroid_index);
  console.log("target grid mid pt", targetgridmidpt);

  sendpathtoserver = true;
  connnectcluster(currentcentroid_index, closest_unexplored_centroid_index);
  sendpathtoserver = false;
}
