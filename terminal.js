var util = util || {};
util.toArray = function(list) {
  return Array.prototype.slice.call(list || [], 0);
};

// Cross-browser impl to get document's height.
util.getDocHeight = function() {
  var d = document;
  return Math.max(
      Math.max(d.body.scrollHeight, d.documentElement.scrollHeight),
      Math.max(d.body.offsetHeight, d.documentElement.offsetHeight),
      Math.max(d.body.clientHeight, d.documentElement.clientHeight)
  );
};


/**
 * Creates a audio context to play sounds
 */
function Sound(opt_loop) {

  var self_ = this;
  var context_ = null;
  var source_ = null;
  var loop_ = opt_loop || false;

  // Get the context
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  if (window.AudioContext) {
    context_ = new window.AudioContext();
  }

  /**
   * Loads in a sound file using XHR.
   *
   * @param {String} url The URL to load
   * @param {Boolean} mixToMono If the sound should be mixed down to mono
   * @param {Function} opt_callback A function to call when the file has loaded
   */
  this.load = function(url, mixToMono, opt_callback) {
    if (context_) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        context_.decodeAudioData(this.response, function(audioBuffer) {
          self_.sample = audioBuffer;
          opt_callback && opt_callback();
        }, function(e) {
          console.log(e);
        });
      };
      xhr.send();
    }
  };

  /**
   * Plays the sound
   */
  this.play = function() {
    if (context_) {
      source_ = context_.createBufferSource();
      source_.buffer = self_.sample;
      source_.looping = loop_;
      source_.connect(context_.destination);
      //source_.noteOn(0);
      source_.start();
    }
  };

  /**
   * Stops the sound
   */
  this.stop = function() {
    if (source_) {
      //source_.noteOff(0);
      source_.stop();
      source_.disconnect(0);
    }
  };
}

/**
 * Represents the terminal
 */
var Terminal = Terminal || function(containerId) {

  var tcpClient;

  var history_ = [];
  var histpos_ = 0;
  var histtemp_ = 0;

  var container_ = document.getElementById(containerId);
  container_.insertAdjacentHTML('beforeEnd',
      ['<output></output>',
       '<div class="input-line">',
        '<input class="cmdline" autofocus />',
       '</div>'].join(''));

  var cmdLine_ = container_.querySelector('.cmdline');
  var output_ = container_.querySelector('output');
  var bell_ = new Sound(false);
  bell_.load('beep.mp3', false);

  // TODO is this still needed?
  output_.addEventListener('DOMSubtreeModified', function(e) {
    // Need this wrapped in a setTimeout. Chrome is jupming to top :(
    setTimeout(function() {
      cmdLine_.scrollIntoView();
    }, 0);

  }, false);

  container_.addEventListener('click', function(e) {
    if (e.target.nodeName.toLowerCase() != 'input') {
      cmdLine_.focus();
    }
  }, false);

  // Always force text cursor to end of input line.
  //cmdLine_.addEventListener('click', inputTextClick_, false);

  // Handle up/down key presses for shell history and enter for new command.
  cmdLine_.addEventListener('keydown', keyboardShortcutHandler_, false);
  cmdLine_.addEventListener('keyup', historyHandler_, false); // keyup needed for input blinker to appear at end of input.
  cmdLine_.addEventListener('keydown', processNewCommand_, false);

  /*
  function inputTextClick_(e) {
    this.value = this.value;
  }
  */

  function keyboardShortcutHandler_(e) {
    /*
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 83) { // crtl+s
      container_.classList.toggle('flicker');
      output('<div>Screen flicker: ' +
             (container_.classList.contains('flicker') ? 'on' : 'off') +
             '</div>');
      e.preventDefault();
      e.stopPropagation();
    }
    */
  }

  /**
   * Callback for keyboard events that scolls through the
   * history of commands put into the terminal
   *
   * @param {Event} e The keyboard event
   */
  function historyHandler_(e) { // Tab needs to be keydown.

    if (history_.length) {
      if (e.keyCode == 38 || e.keyCode == 40) {
        if (history_[histpos_]) {
          history_[histpos_] = this.value;
        } else {
          histtemp_ = this.value;
        }
      }

      if (e.keyCode == 38) { // up
        histpos_--;
        if (histpos_ < 0) {
          histpos_ = 0;
        }
      } else if (e.keyCode == 40) { // down
        histpos_++;
        if (histpos_ > history_.length) {
          histpos_ = history_.length;
        }
      }

      if (e.keyCode == 38 || e.keyCode == 40) {
        this.value = history_[histpos_] ? history_[histpos_] : histtemp_;
        this.value = this.value; // Sets cursor to end of input.
      }
    }
  }

  /**
   * Takes the current command and processes it. Stores it
   * in the history and sends it over TCP to the remote side
   *
   * @param {Event} e The keyboard event (likely enter / return)
   */
  function processNewCommand_(e) {
    // Beep on backspace and no value on command line.
    if (!this.value && e.keyCode == 8) {
      bell_.stop();
      bell_.play();
      return;
    }

    if (e.keyCode == 9) { // Tab
      e.preventDefault();
      // TODO(ericbidelman): Implement tab suggest.
    }
    else if (e.keyCode == 13) { // enter

      // Save shell history.
      if (this.value) {
        history_[history_.length] = this.value;
        histpos_ = history_.length;
      }

      if (this.value.indexOf(':') == 0) {
        this.value = this.value.substring(1);
        console.log('multi');
      }
      
      // Duplicate current input and append to output section.
      //var line = this.parentNode.parentNode.cloneNode(true);
      var line = this.parentNode.cloneNode(true);
      line.classList.add('line');
      var input = line.querySelector('input.cmdline');
      input.autofocus = false;
      input.readOnly = true;
      output_.appendChild(line);
      
      // Send the command!
      if (tcpClient) {
        tcpClient.sendMessage(this.value);
      }

      this.value = ''; // Clear/setup line for next input.
    }
  }
  
  /**
   * Clears the terminal
   *
   * @param {HTMLInputElement} input The input element to clear
   */
  function clear_(input) {
    output_.innerHTML = '';
    input.value = '';
    document.documentElement.style.height = '100%';
  }

  /**
   * Writes to the terminal
   *
   * @param {String} html The HTML to add to the output
   */
  function output(html) {
    output_.insertAdjacentHTML('beforeEnd', html);
    cmdLine_.scrollIntoView();
  }

  function setTcpClient(client) {
    tcpClient = client;
  }
  
  return {
    output: output,
    getCmdLine: function() { return cmdLine_; },
    setTcpClient: setTcpClient
  };
};
