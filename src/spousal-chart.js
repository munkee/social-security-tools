/**
 * Code for driving a chart displaying spousal benefits.
 * @constructor
 */
function SpousalChart() {
  this.canvas_ = null;
}

/**
 * Returns true if the SpousalChart has been initialized with a canvas element
 * and recipient.
 * @return {boolean}
 */
SpousalChart.prototype.isInitialized = function() {
  if (this.canvas_ === null || 
      this.lowerarner_ === null ||
      this.higherEarner_ === null)
    return false;
  return true;
};

/**
 * Sets the canvas on which to render the chart.
 * @param {Element} canvas_element
 */
SpousalChart.prototype.setCanvas = function(canvas_element) {
  this.canvas_ = canvas_element;
  this.context_ = this.canvas_.getContext('2d');
  // Set the font we will use for labels early so we can measure it's width.
  this.context_.font = "bold 14px Helvetica";
  this.mouseToggle = 'ON';
  this.canvas_.addEventListener('mouseout', this.mouseOutListener());
  this.canvas_.addEventListener('mousemove', this.mouseMoveListener());
  this.canvas_.addEventListener('mousedown', this.mouseClickListener());
};

/**
 * Set the earners from which to pull financial data.
 * @param {Recipient} lowerEarner
 * @param {Recipient} higherEarner
 */
SpousalChart.prototype.setRecipients = function(lowerEarner, higherEarner) {
  this.lowerEarner_ = lowerEarner;
  this.higherEarner_ = higherEarner;
};

/**
 * Set the earners from which to pull starting age data.
 * @param {Object} lowerEarnerSlider
 * @param {Object} higherEarnerSlider
 */
SpousalChart.prototype.setSliders = function(
    lowerEarnerSlider, higherEarnerSlider) {
  this.lowerEarnerSlider_ = lowerEarnerSlider;
  this.higherEarnerSlider_ = higherEarnerSlider;
};

/**
 * Set the date range in months that this chart covers.
 * @param {number} startDate months since year 0
 * @param {number} endDate months since year 0
 */
SpousalChart.prototype.setDateRange = function(startDate, endDate) {
  this.startDate_ = startDate;
  this.endDate_ = endDate;
};

// Note that with an HTML canvas, the origin (0, 0) is in the upper left.

/**
 * Compute the usable width of the canvas allowable for the chart.
 * @return {number}
 */
SpousalChart.prototype.chartWidth = function() {
  return this.canvas_.width - 32;
};

/**
 * Compute the usable height of the canvas allowable for the chart.
 * @return {number}
 */
SpousalChart.prototype.chartHeight = function() {
  return 300;
};

/**
 * Compute the canvas x-coordinate for a date in months.
 * @param {number} ageMonths
 * @return {number}
 */
SpousalChart.prototype.canvasX = function(ageMonths) {
  var xValue = (ageMonths - this.startDate_) / (this.endDate_ - this.startDate_)
    * this.chartWidth() + 16;
  // To deal with rounding errors, clip to the usable range.
  return Math.round(Math.max(16, Math.min(this.chartWidth() + 16, xValue)));
};

/**
 * Inverse of canvasX, computes a date in months for a canvas x-coordinate.
 * @param {number} x
 * @return {number}
 */
SpousalChart.prototype.dateX = function(x) {
  // Clip x to a range smaller than the chart.
  x = Math.max(16, Math.min(this.chartWidth() + 16, x));
  var ageMonths = ((x - 16) / this.chartWidth()) 
    * (this.endDate_ - this.startDate_) + this.startDate_;
  return Math.round(ageMonths);
};
 
/**
 * Render a series of vertical lines, one per year in the date range.
 */
SpousalChart.prototype.renderYearVerticalLines = function() {
  this.context_.save();
  // Grey dashed lines.
  this.context_.strokeStyle = '#666';
  this.context_.setLineDash([2,2]);

  firstYearIdx = this.startDate_;
  // If the start date doesn't fall on a year value, move it forward until
  // it does.
  if (firstYearIdx % 12 !== 0)
    firstYearIdx += 12 - (firstYearIdx % 12);

  // Iterate over each year within the date range.
  for (var i = firstYearIdx; i <= this.endDate_; i += 12) {
    // Draw vertical line.
    this.context_.beginPath();
    this.context_.moveTo(this.canvasX(i), 40);
    this.context_.lineTo(this.canvasX(i), 600);
    this.context_.stroke();
  
    // Print the year vertically atop the line, with a white rectangle behind
    // the text, so that the line isn't going through the text.
    text = '' + Math.floor(i / 12);
    var textWidth = this.context_.measureText(text).width;
    var xpos = 210 + textWidth;

    this.context_.save();
    this.context_.translate(this.canvasX(i) + 5, xpos);
    this.context_.rotate(-90 * Math.PI / 180);
    this.context_.fillStyle = '#FFF';
    this.context_.fillRect(-8, -13, textWidth + 16, 16);
    this.context_.fillStyle = '#999';
    this.context_.fillText(i / 12, 0, 0);
    this.context_.restore();
  }
  this.context_.restore();
};

/**
 * Renders a single vertical line at the user's selected date.
 * @param{number} canvasX x-coordinate of vertical line we should render.
 */
SpousalChart.prototype.renderSelectedDateVerticalLine = function(canvasX) {
  var months = this.dateX(canvasX);
  var text = ALL_MONTHS[months % 12] + ' ';
  text += Math.floor(months / 12);

  this.context_.save();
  // Bluish dashed lines.
  this.context_.strokeStyle = '#337ab7';
  this.context_.setLineDash([3,5]);
  this.context_.lineCap = 'butt';
  this.context_.lineWidth = 2;

  // Draw vertical line.
  this.context_.beginPath();
  this.context_.moveTo(canvasX, 40);
  this.context_.lineTo(canvasX, 600);
  this.context_.stroke();

  var textWidth = this.context_.measureText(text).width;
  var xpos = 210 + textWidth;

  // Print the year vertically atop the line, with a white rectangle behind
  // the text, so that the line isn't going through the text.
  this.context_.save();
  this.context_.translate(canvasX + 5, xpos);
  this.context_.rotate(-90 * Math.PI / 180);
  this.context_.fillStyle = '#FFF';
  this.context_.fillRect(-8, -13, textWidth + 16, 16);
  this.context_.fillStyle = '#337ab7';
  this.context_.fillText(text, 0, 0);
  this.context_.restore();

  this.context_.restore();
};

/**
 * Render a pair of Axis in the bottom and left side of the chart.
 */
SpousalChart.prototype.renderAxes = function() {
  this.context_.save();
  this.context_.strokeStyle = '#000';
  this.context_.lineWidth = 1;

  this.context_.beginPath();
  this.context_.moveTo(0, 260);
  this.context_.lineTo(0, 600);
  this.context_.lineTo(620, 600);
  this.context_.lineTo(620, 260);
  this.context_.stroke();

  this.context_.restore();
};

/**
 * Computes the date (in months) that the higher earner starts receiving
 * benefits.
 */
SpousalChart.prototype.higherEarnerStartDate = function() {
  // The date (in months) that the earner starts recieving benefits.
  return this.higherEarner_.dateMonthsAtAge(62) +
    this.higherEarnerSlider_.value - (62 * 12);
};

/**
 * Computes the date (in months) that the lower earner starts receiving
 * benefits.
 */
SpousalChart.prototype.lowerEarnerStartDate = function() {
  // The date (in months) that the earner starts recieving benefits.
  return this.lowerEarner_.dateMonthsAtAge(62) +
    this.lowerEarnerSlider_.value - (62 * 12);
};

/**
 * Computes the age (in months) that the higher earner starts receiving
 * benefits.
 */
SpousalChart.prototype.higherEarnerStartAge = function() {
  // The date (in months) that the earner starts recieving benefits.
  var date = this.higherEarnerStartDate();
  return this.higherEarner_.monthsOldAtDate(Math.floor(date / 12), date % 12);
};

/**
 * Computes the age (in months) that the lower earner starts receiving
 * benefits.
 */
SpousalChart.prototype.lowerEarnerStartAge = function() {
  // The date (in months) that the earner starts recieving benefits.
  var date = this.lowerEarnerStartDate();
  return this.lowerEarner_.monthsOldAtDate(Math.floor(date / 12), date % 12);
};

/**
 * Render the earnings of the higher earner.
 */
SpousalChart.prototype.renderHigherEarner = function() {
  this.context_.save();
  this.context_.lineWidth = 2;
  var startDate = this.higherEarnerStartDate();
  var startAge = this.higherEarnerStartAge();

  var dollars = this.higherEarnerPersonalBenefit();
  
  this.context_.strokeStyle = '#600';
  this.context_.beginPath();
  this.context_.moveTo(this.canvas_.width, this.canvasHigherY(0));
  this.context_.lineTo(this.canvasX(startDate), this.canvasHigherY(0));
  this.context_.lineTo(this.canvasX(startDate), this.canvasHigherY(dollars));
  this.context_.lineTo(this.canvas_.width, this.canvasHigherY(dollars));
  this.context_.stroke();

  this.context_.restore();
};

/**
 * Compute the start date (in months) when the spousal benefits start.
 */
SpousalChart.prototype.spousalStartDate = function() {
  var startDate = this.lowerEarnerStartDate();
  var startSpouseDate = this.higherEarnerStartDate();
  return Math.max(startDate, startSpouseDate);
};

/**
 * Compute the higher earner's personal benefit in dollars.
 */
SpousalChart.prototype.higherEarnerPersonalBenefit = function() {
  var startAge = this.higherEarnerStartAge();
  const startAgeYears = Math.floor(startAge / 12);
  const startAgeMonths = startAge % 12;
  return this.higherEarner_.benefitAtAge(startAgeYears, startAgeMonths);
};

/**
 * Compute the lower earner's personal benefit in dollars.
 */
SpousalChart.prototype.lowerEarnerPersonalBenefit = function() {
  var startAge = this.lowerEarnerStartAge();
  const startAgeYears = Math.floor(startAge / 12);
  const startAgeMonths = startAge % 12;
  return this.lowerEarner_.benefitAtAge(startAgeYears, startAgeMonths);
};

/**
 * Compute the lower earner's spousal benefit in dollars.
 */
SpousalChart.prototype.lowerEarnerSpousalBenefit = function() {
  var startAge = this.lowerEarnerStartAge();
  const startAgeYears = Math.floor(startAge / 12);
  const startAgeMonths = startAge % 12;

  var spousalStartDate = this.spousalStartDate();
  var spousalStartAge = this.lowerEarner_.monthsOldAtDate(spousalStartDate);
  const spousalStartAgeYears = Math.floor(spousalStartAge / 12);
  const spousalStartAgeMonths = spousalStartAge % 12;

  return this.lowerEarner_.totalBenefitWithSpousal(
      startAgeYears, startAgeMonths,
      spousalStartAgeYears, spousalStartAgeMonths);
};

/**
 * Render the earnings of the lower earner.
 */
SpousalChart.prototype.renderLowerEarner = function() {
  this.context_.save();
  this.context_.lineWidth = 2;

  // Compute the various bend point dates and dollar values.
  var startDate = this.lowerEarnerStartDate();
  var spousalStartDate = this.spousalStartDate();
  var personal = this.lowerEarnerPersonalBenefit();
  var spousal = this.lowerEarnerSpousalBenefit();
  var total = personal + spousal;
  
  this.context_.strokeStyle = '#060';
  this.context_.beginPath();
  this.context_.moveTo(this.canvas_.width, this.canvasLowerY(0));
  this.context_.lineTo(this.canvasX(spousalStartDate), this.canvasLowerY(0));
  if (personal > 0) {
    this.context_.lineTo(this.canvasX(startDate), this.canvasLowerY(0));
    this.context_.lineTo(this.canvasX(startDate), this.canvasLowerY(personal));
  }
  this.context_.lineTo(this.canvasX(spousalStartDate),
                       this.canvasLowerY(personal));
  this.context_.lineTo(this.canvasX(spousalStartDate),
                       this.canvasLowerY(total));
  this.context_.lineTo(this.canvas_.width, this.canvasLowerY(total));

  this.context_.stroke();
  this.context_.restore();
};

/** Render the spousal chart. */
SpousalChart.prototype.render = function() {
  // Canvas tutorial:
  // http://www.html5canvastutorials.com/tutorials/html5-canvas-element/
  this.context_.save();
  this.context_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  
  this.renderYearVerticalLines();
  this.renderAxes();
  this.renderHigherEarner();
  this.renderLowerEarner();

  if (this.mouseToggle === 'OFF')
    this.renderSelectedDateVerticalLine(this.lastMouseX);

  this.context_.restore();
};

/**
 * Selects a y-coordinate (in dollars) to be the topmost edge
 * of our chart.
 * @return {Number}
 */
SpousalChart.prototype.maxRenderedYDollars = function() {
  return this.higherEarner_.benefitAtAge(70, 0) +
         this.lowerEarner_.benefitAtAge(70, 0) +
         this.lowerEarner_.totalBenefitWithSpousal(70, 0, 70, 0);
};

/**
 * Compute the canvas y-coordinate for a benefit dollars value.
 * @param {number} benefitY
 * @return {number}
 */
SpousalChart.prototype.canvasY = function(benefitY) {
  var yValue = this.canvas_.height -
      Math.floor(benefitY / this.maxRenderedYDollars() * this.chartHeight());
  return yValue;
};

SpousalChart.prototype.midpointYValue = function() {
  // The midpoint line is the canvas y position of the 0 benefit line.
  var spousalDollars =
      this.lowerEarner_.benefitAtAge(70, 0) +
      this.lowerEarner_.totalBenefitWithSpousal(70, 0, 70, 0);
  var midpointYValue = this.canvas_.height -
      Math.floor(spousalDollars / this.maxRenderedYDollars()
          * this.chartHeight()) - 10;

  return midpointYValue;
}

/**
 * Compute the canvas y-coordinate for a benefit dollars value of the lower
 * earner, shown on the bottom of the chart.
 * @param {number} benefitY
 * @return {number}
 */
SpousalChart.prototype.canvasLowerY = function(benefitY) {
  // canvasYValue is the absolute number canvas pixels that this point
  // represents above 0.
  var canvasYValue =
      Math.floor(benefitY / this.maxRenderedYDollars() * this.chartHeight());

  return this.midpointYValue() + canvasYValue;
};

/**
 * Compute the canvas y-coordinate for a benefit dollars value of the higher
 * earner, shown on the top of the chart.
 * @param {number} benefitY
 * @return {number}
 */
SpousalChart.prototype.canvasHigherY = function(benefitY) {
  // canvasYValue is the absolute number canvas pixels that this point
  // represents above 0.
  var canvasYValue =
      Math.floor(benefitY / this.maxRenderedYDollars() * this.chartHeight());

  return this.midpointYValue() - canvasYValue;
};

/** Renders specific value boxes based on mouse location. */
SpousalChart.prototype.mouseOutListener = function() {
  var self = this;
  return function(e) {
    if (self.mouseToggle == 'OFF')
      return;
    self.render();
  };
};

/** Toggles on/off functionality of mouseMoveListener. */
SpousalChart.prototype.mouseClickListener = function() {
  var self = this;
  return function(e) {
    if (e.clientY < 200)
      return;
    if (self.mouseToggle === 'ON') {
      self.mouseToggle = 'OFF';
      self.lastMouseX = e.clientX - self.canvas_.getBoundingClientRect().left;
    } else {
      self.mouseToggle = 'ON';
      // Immediately trigger a rendering based on mouse location.
      self.mouseMoveListener()(e);
    }
  };
};

/** Renders specific value boxes based on mouse location. */
SpousalChart.prototype.mouseMoveListener = function() {
  var self = this;
  return function(e) {
    if (self.mouseToggle == 'ON') {
      self.render();
      if (e.clientY < 200)
        return;
      var canvasX = e.clientX - self.canvas_.getBoundingClientRect().left;
      self.renderSelectedDateVerticalLine(canvasX);
    }
  };
};
