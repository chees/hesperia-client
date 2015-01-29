/*
function toggleHelp() {
  document.querySelector('.help').classList.toggle('hidden');
  document.body.classList.toggle('dim');
}
*/

(function() {

  var ansiConv = new AnsiConverter();

  var term1 = new Terminal('output1');
  var term2 = new Terminal('output2');
  var term3 = new Terminal('output3');

  // Capture key presses
  /*
  document.body.addEventListener('keydown', function(e) {
    if (e.keyCode == 27) { // Esc
      toggleHelp();
      e.stopPropagation();
      e.preventDefault();
    }
  }, false);
  */
  

  var host = '149.210.199.92';
  var port = 7000;
  connect(host, port, term1);
  connect(host, port, term2);
  connect(host, port, term3);

  /*
  var button = document.getElementById('connect');
  button.addEventListener('click', function() {
    var host = document.getElementById('host').value;
    var port = parseInt(document.getElementById('port').value, 10);
    tcpClient.disconnect();
    connect(host, port);
    toggleHelp();
  });
  */
  
  function connect(host, port, term) {
    var tcpClient = new TcpClient(host, port);
    tcpClient.connect(function() {
      term.setTcpClient(tcpClient);
      term.output('Connected to ' + host + ':' + port + '<br/>');
      tcpClient.addResponseListener(function(data) {
        // Strip Telnet negotiation characters:
        if (data.indexOf('��U') != -1) {
          data = data.substring(5);
        }
        // TODO this fails when the color code is split over 2 packages:
        var formattedData = ansiConv.formatAnsi(data);
        var lines = formattedData.split('\n');
        var output = lines.join('<br/>');
        term.output(output);
      });
    });
  }

})();
