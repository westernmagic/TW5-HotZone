/*\

title: $:/plugins/felixhayashi/hotzone/hotzone.js
type: application/javascript
module-type: startup

@preserve

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "hotzone";
exports.platforms = ["browser"];
exports.after = ["story"];
exports.synchronous = true;

exports.startup = function() {

/***************************** IMPORTS *****************************/
 
var config = require("$:/plugins/felixhayashi/hotzone/config.js").config;

/*************************** VARIABLES *****************************/

var curRef = null;
var isTimeoutActive = false;
var storyRiverElement = document.getElementsByClassName(config.classNames.storyRiver)[0];
var userConf = $tw.wiki.getTiddlerData(config.references.userConfig, {});
var focusOffset = (isNaN(parseInt(userConf.focusOffset))
                   ? 150 : parseInt(userConf.focusOffset)); // px

/*************************** FUNCTIONS *****************************/
          
/**
 * Extracts the tiddler title from dom elements holding it.
 * 
 * @param {Element} target - The tiddler frame element.
 * @return {string} The title or undefined
 */
var extractTitleFromFrame = function(target, frameClass, titleClass) {
    
  if(!(target instanceof Element)) return;
  if(!$tw.utils.hasClass(target, config.classNames.tiddlerFrame)) return;

  var el = target.getElementsByClassName(config.classNames.tiddlerTitle)[0];
  if(el) {
    var title = el.innerText || el.textContent;
    return title.trim();
  }

};

/**
 * Calls the scroll handler after with a certain delay. If no delay
 * is specified, the handler is instantly called. If a delay
 * is specified then any new call to update is ignored until the delay
 * is over and the handler has been called.
 * 
 * @param {number} delay - Time after a scroll event that has to elapse
 *     before we check which tiddler is actually focussed. A delay may
 *     be necessary to avoid updates that only result from scroll animations.
 */
var update = function(delay) {
      
  if(!isTimeoutActive) {
    isTimeoutActive = true;
    window.setTimeout(checkForFocusChange, delay || 0);
  }

};

/**
 * Set a flag (class) to the active tiddler frame element and also
 * register the change at the focussed-tiddler-store.
 * 
 * @param {string} tRef - The title of the newly focussed tiddler.
 * @param {Element} [target] - If available, the frame that corresponds
 *     to the focussed tiddler.
 */
var registerFocusChange = function(tRef, target) {
  
  $tw.wiki.addTiddler(new $tw.Tiddler({
      title: config.references.focussedTiddlerStore,
      text: tRef
    },
    $tw.wiki.getModificationFields()
  ));
  
  if(target) {
    var prevTarget = document.getElementsByClassName("hzone-focus")[0];
    // remove class from previous
    if(prevTarget) {
      $tw.utils.removeClass(prevTarget, "hzone-focus");
    }
    // add class to current
    $tw.utils.addClass(target, "hzone-focus");
  }
  
};

/**
 * Tries to extract the title from the frame that is currently in
 * focus and to register any changes.
 */
var checkForFocusChange = function() {
  
  console.log("handler called");
  
  var frames = storyRiverElement.getElementsByClassName(config.classNames.tiddlerFrame);
  if(frames.length) {
    
    var offsetLeft = frames[0].getBoundingClientRect().left;

    // + 1px as sometimes scroll is not correctly on point
    // TODO: this does not work if modal is shown!
    var target = document.elementFromPoint(offsetLeft + 1, focusOffset);
    
    var title = extractTitleFromFrame(target);
    
    if(title !== curRef && $tw.wiki.getTiddler(title)) { // focus changed
      curRef = title;
      registerFocusChange(curRef, target);
    }
    
  } else {
    if(curRef) {
      curRef = "";
      registerFocusChange(curRef);
    }
  }
  
  isTimeoutActive = false;
  
};

/**
 * Handler to react to tiddler changes
 */
var handleChangeEvent = function(changedTiddlers) {

  // Delay scroll handling that results from navigation
  // A navigation-scroll occurs if the current tiddler of the
  // history list changed and this tiddler also exists in the
  // current story list.
  if(!changedTiddlers["$:/HistoryList"]) return;
  if(!$tw.wiki.tiddlerExists("$:/HistoryList")) return;
  
  var curTiddler = $tw.wiki.getTiddler("$:/HistoryList").fields["current-tiddler"];
  var storyList = $tw.wiki.getTiddlerList("$:/StoryList");
  var isInStoryList = storyList.indexOf(curTiddler) >= 0;
  isInStoryList
  if(!isInStoryList) return;
  
  // navigation-scroll took place; use animation duration as delay
  // add a bit of delay to make sure the scroll handler is not triggered
  // by the scroll listener
  update($tw.utils.getAnimationDuration() + 100);
  
};

/**
 * Handler to react to scroll events
 */
var handleScrollEvent = function(event) {
    
  // update with a delay of 250ms to avoid uncessary calculations
  update(250);
  
};
  
/**************************** RUNTIME ******************************/

// register listeners
$tw.wiki.addEventListener("change", handleChangeEvent);
window.addEventListener('scroll', handleScrollEvent, false);  

// simulate a scroll after startup
handleScrollEvent();
      
};

})();