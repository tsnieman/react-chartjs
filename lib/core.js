var React = require('react');
var ReactDOM = require('react-dom');

module.exports = {
  createClass: function(chartType, methodNames, dataKey) {
    var classData = {
      displayName: chartType + 'Chart',
      getInitialState: function() { return {}; },
      render: function() {
        var _props = {
          ref: 'canvass'
        };
        for (var name in this.props) {
          if (this.props.hasOwnProperty(name)) {
            if (name !== 'data' && name !== 'options') {
              _props[name] = this.props[name];
            }
          }
        }
        return React.createElement('canvas', _props);
      }
    };

    var extras = ['clear', 'stop', 'resize', 'toBase64Image', 'generateLegend', 'update', 'addData', 'removeData'];
    function extra(type) {
      classData[type] = function() {
        this.state.chart[name].apply(this.state.chart, arguments);
      };
    }

    classData.componentDidMount = function() {
      this.initializeChart(this.props);
    };

    classData.componentWillUnmount = function() {
      var chart = this.state.chart;
      chart.destroy();
    };

    classData.componentWillReceiveProps = function(nextProps) {
      var chart = this.state.chart;
      if (nextProps.redraw) {
        chart.destroy();
        this.initializeChart(nextProps);
      } else {
        dataKey = dataKey || dataKeys[chart.name];
        updatePoints(nextProps, chart, dataKey);
        chart.scaleLabel = nextProps.data.labels;
        //chart.scale.calculateXLabelRotation(); // Needed for chartjs-2.0.0?
        chart.update();
      }
    };

    classData.initializeChart = function(nextProps) {
      var Chart = require('chart.js');
      var el = ReactDOM.findDOMNode(this);
      var ctx = el.getContext("2d");

      var options = nextProps ? {
        "type": chartType.toLowerCase(),
        "data": nextProps.data,
        "options": nextProps,
      } : {};

      var chart = new Chart(ctx, options);

      this.state.chart = chart;
    };

    // return the chartjs instance
    classData.getChart = function() {
      return this.state.chart;
    };

    // return the canvass element that contains the chart
    classData.getCanvass = function() {
      return this.refs.canvass;
    };

    classData.getCanvas = classData.getCanvass;

    var i;
    for (i=0; i<extras.length; i++) {
      extra(extras[i]);
    }
    for (i=0; i<methodNames.length; i++) {
      extra(methodNames[i]);
    }

    return React.createClass(classData);
  }
};

var dataKeys = {
  'Line': 'points',
  'Radar': 'points',
  'Bar': 'bars'
};

var updatePoints = function(nextProps, chart, dataKey) {
  var name = chart.name;

  if (name === 'PolarArea' || name === 'Pie' || name === 'Doughnut') {
    nextProps.data.forEach(function(segment, segmentIndex) {
      if (!chart.segments[segmentIndex]) {
        chart.addData(segment);
      } else {
        chart.segments[segmentIndex].value = segment.value;
      }
    });
  } else {
    // TODO
    //while (chart.scaleLabel.length > nextProps.data.labels.length) {
    if (chart.scale) { // TODO remove. probably not what the logic should be.
      chart.removeData();
    }
    //}
    nextProps.data.datasets.forEach(function(set, setIndex) {
      set.data.forEach(function(val, pointIndex) {
        // TODO come back to this if/else logic.
        // Typically the vars look like this: {setIndex: 0, dataKey: undefined, pointIndex: 0}
        // which seems awfully wrong. This logic has been modified for chartjs-2.0.0 and may not
        // be accurate/good anymore.
        if (typeof(chart.options.data.datasets[setIndex]) == "undefined") {
          addData(nextProps, chart, setIndex, pointIndex);
        } else {
          chart.options.data.datasets[setIndex].data[dataKey] = val;
          chart.update();
        }
      });
    });
  }
};

var addData = function(nextProps, chart, setIndex, pointIndex) {
  var values = [];
  nextProps.data.datasets.forEach(function(set) {
    values.push(set.data[pointIndex]);
  });
  chart.addData(values, nextProps.data.labels[setIndex]);
};
