jsPsych.plugins["gear-toy"] = (function () {

  var plugin = {};

  plugin.info = {
    name: "gear-toy",
    parameters: {
      number: {
        type: jsPsych.plugins.parameterType.INT,
        default: 10
      },
      factors: {
        type: jsPsych.plugins.parameterType.INT,
        array: true,
        default: [64, 48]
      },
      styles: {
        type: jsPsych.plugins.parameterType.STRING,
        array: true,
        default: ["style-0", "style-1", "style-2", "style-3", "style-4"]
      },
      speed: {
        type: jsPsych.plugins.parameterType.INT,
        default: 0.01
      },
      highlight_powered: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: true
      }
    }
  }

  plugin.trial = function (display_element, trial) {
    $(display_element).html(`<div class="gears-d3-canvas"></div>`)
    $(".jspsych-content").addClass("mw-100");

    var _svg,
      _allGears = [],
      _canvasWidth = $(".jspsych-content-wrapper").width(),
      _canvasHeight = $(".jspsych-content-wrapper").height(),
      _xOffset = _canvasWidth * 0.5,
      _yOffset = _canvasHeight * 0.5,
      _gearFactors = trial.factors,
      _gearStyles = trial.styles,
      _autoShuffle = true,
      _dragBehaviour;

    var _options = {
      radius: 32,
      holeRadius: 0.4,
      transition: true,
      speed: trial.speed,
      autoShuffle: true,
      number: trial.number,
      addendum: 8,
      dedendum: 3,
      thickness: 0.7,
      profileSlope: 0.5
    };

    var started = -1;
    var trial_data = {
      rt: -1,
      drag_starts: [0],
      drag_ends: [0],
      drag_moving_gears: [trial.number]
    };

    $(function () {
      // prevent canvas doing odd things on click
      $(".gears-d3-canvas").on("mousedown", function (e) {
        e.originalEvent.preventDefault();
      });

      // start the demo
      main();

      // for ie css fix
      var isIE = window.ActiveXObject || "ActiveXObject" in window;
      if (isIE)
        $("body").addClass("ie");
    });

    function main() {
      // set up our d3 svg element
      _svg = d3.select(".gears-d3-canvas")
        .append("svg")
        .attr("viewBox", "0 0 " + _canvasWidth + " " + _canvasHeight)
        .attr("preserveAspectRatio", "xMinYMin slice");

      // get a d3 dragBehaviour using Gear helper
      _dragBehaviour = Gear.dragBehaviour(_allGears, _svg);

      // extend the dragbehaviour to disable randomise while dragging
      _dragBehaviour
        .on("dragstart.i", function () {
          _autoShuffle = false;
          trial_data.drag_starts.push(performance.now() - started);
        })
        .on("dragend.i", function () {
          _autoShuffle = false;
          trial_data.drag_ends.push(performance.now() - started);

          var collisions = Gear.anyGearCollides(_allGears[0].datum(), _allGears, 10);
          var movingGears = 0;

          for (var i = 0; i < _allGears.length; i++)
            if (_allGears[i].datum().speed != 0)
              movingGears++;

          trial_data.drag_moving_gears.push(movingGears);

          if (collisions < 1) {
            console.log(`stopping`);
            trial_data.rt = performance.now() - started;

            setTimeout(function() {
              jsPsych.finishTrial(trial_data);
            }, 250);
          }
        });

      // generate and randomise scene
      _generateScene(_options);
      _randomiseScene(false, _options);

      // start the d3 animation timer
      d3.timer(function () {
        _svg.selectAll(".gear-path")
          .attr("transform", function (d) {
            d.angle += d.speed;
            return "rotate(" + d.angle * (180 / Math.PI) + ")";
          });
      });

      // start reaction timer
      started = performance.now();
    }

    var _generateScene = function (options) {
      var holeRadius,
        teeth,
        radius,
        factor,
        newGear,
        innerRadius;

      // _gearStyles = Gear.Utility.arrayShuffle(_gearStyles);

      for (var i = 0; i < options.number; i++) {
        factor = _gearFactors[i % _gearFactors.length];
        radius = factor / 2;
        teeth = radius / 4;
        innerRadius = radius - options.addendum - options.dedendum;
        holeRadius = factor > 96 ? innerRadius * 0.5 + innerRadius * 0.5 * options.holeRadius : innerRadius * options.holeRadius;

        _allGears.push(newGear = Gear.create(_svg, {
          radius: radius,
          teeth: teeth,
          x: 0,
          y: 0,
          holeRadius: holeRadius,
          addendum: options.addendum,
          dedendum: options.dedendum,
          thickness: options.thickness,
          profileSlope: options.profileSlope
        }));

        newGear.call(_dragBehaviour);
        newGear.classed(_gearStyles[i % _gearStyles.length], true);
      }
    };

    var _randomiseScene = function (transition, options) {
      _allGears = Gear.Utility.arrayShuffle(_allGears);
      Gear.randomArrange(_allGears, _xOffset, _yOffset);
      Gear.setPower(_allGears[0], options.speed);

      if (trial.highlight_powered)
        _allGears[0].classed("pow", true);

      Gear.updateGears(_allGears);

      _svg.selectAll(".gear")
        .each(function (d, i) {
          if (transition) {
            d3.select(this)
              .transition()
              .ease("elastic")
              .delay(i * 80 + Math.random() * 80)
              .duration(1500)
              .attr("transform", function (d) {
                return "translate(" + [d.x, d.y] + ")";
              });
          } else {
            d3.select(this)
              .attr("transform", function (d) {
                return "translate(" + [d.x, d.y] + ")";
              });
          }
        });
    };

    /*
    setTimeout(() => {
      jsPsych.finishTrial({ test: true });
    }, 1000);
    */
  };

  return plugin;
})();
