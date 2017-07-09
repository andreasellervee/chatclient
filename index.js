var socket;
var stompClient;
var username;

function setupSocketJs(name) {
	username = name
	socket = new SockJS('http://localhost:8080/chatserver-websocket');
	stompClient = Stomp.over(socket);
	stompClient.connect({}, function (frame) {
		console.log("Connected " + frame);
		stompClient.subscribe('/user/' + name + '/test', function (message) {
			console.log(message);
			var body = JSON.parse(message.body);
			$('#chat-content').val(function(i, text){
				return text + body.from.name + ": " + body.data + "\n";
			});
		});
	});
}

function connect() {
	var user = $('#name').val();
	console.log(user);
	if (user) {
		setupSocketJs(user);
	}
}

function sendMessage() {
	if (!socket) return;
	var message = $('#message').val();
	var to = $('#to').val();
}
