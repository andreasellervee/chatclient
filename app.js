angular.module('ChatClient', [])
       .controller('mainController', mainController)
       .factory('messageService', messageService);

function mainController($scope, messageService) {
  var vm = this;

  vm.from = '';
  vm.to = '';
  vm.messages = [];

  vm.connectToChat = connectToChat;
  vm.chatWith = chatWith;
  vm.sendMessage = sendMessage;

  function connectToChat() {
    if (!vm.from) return;
  	stompClient = Stomp.over(new SockJS(messageService.endpoint + '/chatserver-websocket'));
  	stompClient.connect({}, function (frame) {
  		stompClient.subscribe('/user/' + vm.from + '/message', function (message) {
  			var parsedMessage = JSON.parse(message.body);
        messageService.setMessageStatus(parsedMessage.id, 'RECEIVED',
          function toSeen() {
            messageService.setMessageStatus(parsedMessage.id, 'SEEN');
          }
        );
        parsedMessage.messageStatus = 'SEEN';
        vm.messages.push(parsedMessage);
  		});
      stompClient.subscribe('/user/' + vm.from + '/notification', function (messageStatusChange) {
        var parsedNotification = JSON.parse(messageStatusChange.body);
        for (var i = vm.messages.length-1; i >= 0; i--) {
          if (vm.messages[m].id === parsedNotification.messageId) {
            vm.messages[m].messageStatus = parsedNotification.newStatus;
            break;
          }
        }
        $scope.$apply();
      })
  	});
  }

  function chatWith() {
    if (!vm.to) return;
    vm.messages = [];
    messageService.getPreviousMessages(vm.from, vm.to,
      function response(previousMessages) {
        vm.messages = vm.messages.concat(previousMessages.data);
        messageService.getUnreadMessages(vm.to, vm.from,
          function response(unreadMessages) {
            vm.messages = vm.messages.concat(unreadMessages.data);
            angular.forEach(unreadMessages.data, function (m) {
              if (m.messageStatus === 'SENT') {
                messageService.setMessageStatus(m.id, 'RECEIVED',
                  function toSeen() {
                    messageService.setMessageStatus(m.id, 'SEEN');
                  }
                );
              } else if (m.messageStatus === 'RECEIVED') {
                messageService.setMessageStatus(m.id, 'SEEN');
              }
              m.messageStatus = 'SEEN';
            })
          }
        )
      }
    );

  }

  function sendMessage() {
    if (!vm.from || !vm.to || !vm.data) return;
    messageService.sendNewMessage(vm.from, vm.to, vm.data,
      function response(message) {
        vm.messages.push(message.data);
        vm.data = null;
      }
    );
  }
}

function messageService($http) {
  const ENDPOINT = 'http://localhost:8080';
  var api = {
    endpoint: ENDPOINT;
  };

  api.sendNewMessage = function(from, to, data, successFn) {
      $http({
        method: 'POST',
        url: ENDPOINT + '/api/message',
        data: {
          from: from,
          to: to,
          data: data
        }
      }).then(successFn);
  };
  api.getPreviousMessages = function(from, to, successFn) {
    $http({
      method: 'GET',
      url: ENDPOINT + '/api/message/previous_messages',
      params: {
        from: from,
        to: to
      }
    }).then(successFn);
  };
  api.getUnreadMessages = function(from, to, successFn) {
    $http({
      method: 'GET',
      url: ENDPOINT + '/api/message/unread_messages',
      params: {
        from: from,
        to: to
      }
    }).then(successFn);
  };
  api.setMessageStatus = function(id, status, successFn) {
    $http({
      method: 'PUT',
      url: ENDPOINT + '/api/message/' + id + '/' + status
    }).then(successFn);
  };

  return api;
}
