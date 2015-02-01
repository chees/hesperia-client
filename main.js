var term1 = new Terminal('output1');
var term2 = new Terminal('output2');
var term3 = new Terminal('output3');

(function() {

  var ansiConv = new AnsiConverter();

  term1.setNextTerminal(term2);
  term2.setNextTerminal(term3);
  term3.setNextTerminal(term1);
  
  var host = '149.210.199.92';
  var port = 7000;
  
  connect(host, port, term1);
  connect(host, port, term2);
  connect(host, port, term3);
  
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
        data = data.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        // TODO this fails when the color code is split over 2 network packets:
        var formattedData = ansiConv.formatAnsi(data);
        var lines = formattedData.split('\n');
        var output = lines.join('<br/>');
        term.output(output);
      });
    });
  }

})();

function sendAll(msg) {
  term1.output('<div style="color:#ffff00">' + msg + '</div>');
  term1.getTcpClient().sendMessage(msg);
  term2.output('<div style="color:#ffff00">' + msg + '</div>');
  term2.getTcpClient().sendMessage(msg);
  term3.output('<div style="color:#ffff00">' + msg + '</div>');
  term3.getTcpClient().sendMessage(msg);
}
