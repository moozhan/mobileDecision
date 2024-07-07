function Condition_AI() {
	var that = this;
	this.p = player;
	this.allGamesData = {
		player_initials: that.p.initials,
		games: []
	};

	this.opponent_move = function () {
		that.b.game_status = 'playing';
		$('.tile').off('mouseenter').off('mouseleave').off('click');
		$('.canvas, .canvas div').css('cursor', 'none');
		$('.headertext h1').text('Waiting for opponent').css('color', '#333333');
		var bp = that.b.black_position.join("");
		var wp = that.b.white_position.join("");
		setTimeout(function () {
			console.log('Making move with opponent:', that.current_opponent);
			that.b.last_move = that.makemove(Date.now(), bp, wp, that.current_opponent);
			console.log('Opponent move:', that.b.last_move);
			that.b.add_piece(that.b.last_move, that.p.opponent_color);
			that.b.show_last_move(that.b.last_move, that.p.opponent_color);
			that.b.evaluate_win(that.p.opponent_color);

			that.p.currentGame.moves.push({
				move: that.b.last_move,
				color: that.p.opponent_color,
				duration: Date.now() - that.p.move_end,
				board_state: {
					black: [...that.b.black_position],
					white: [...that.b.white_position]
				}
			});

			if (that.b.game_status == 'win') {
				that.p.opponent_score++;
				$('#p1-score h2').text(that.p.opponent_score);
				$('#feedback-modal').modal('show');
				that.p.currentGame.result = 'loss';
				console.log('Opponent won, setting result to loss');
				that.saveGameData('loss');
			} else if (that.b.game_status == 'draw') {
				$('#feedback-modal').modal('show');
				that.p.currentGame.result = 'draw';
				console.log('Game is a draw, setting result to draw');
				that.saveGameData('draw');
			} else {
				that.init_turn();
			}
		}, 500);
	};

	this.tileClickHandler = function (e) {
		that.p.move_end = Date.now();
		that.p.move = parseInt(e.target.id);
		that.b.add_piece(that.p.move, that.p.color);
		that.b.show_last_move(that.p.move, that.p.color);
		that.p.duration = that.p.move_end - that.p.move_start;
		that.b.evaluate_win(that.p.color);

		that.p.currentGame.moves.push({
			move: that.p.move,
			color: that.p.color,
			duration: that.p.duration,
			board_state: {
				black: [...that.b.black_position],
				white: [...that.b.white_position]
			}
		});

		if (that.b.game_status == 'win') {
			that.p.score++;
			$('#p0-score h2').text(that.p.score);
			$('#feedback-modal').modal('show');
			that.p.currentGame.result = 'win';
			console.log('Player won, setting result to win');
			that.saveGameData('win');
		} else if (that.b.game_status == 'draw') {
			$('#feedback-modal').modal('show');
			that.p.currentGame.result = 'draw';
			console.log('Game is a draw, setting result to draw');
			that.saveGameData('draw');
		} else {
			that.opponent_move();
		}
	};

	this.init_turn = function () {
		that.p.move_start = Date.now();
		that.b.highlight_tiles();
		$('.headertext h1').text('Your turn').css('color', '#000000');
		$('.canvas, .tile').css('cursor', 'pointer');
		$('.usedTile, .usedTile div').css('cursor', 'default');
		$('.tile').off('click').on('click', function (e) { that.tileClickHandler(e); });
	};

	this.start_game = function () {
		that.b = new Board();
		that.b.create_tiles();
		if (typeof that.current_opponent === 'undefined') {
			that.current_opponent = 5;  // Initial opponent
		}
		console.log('Starting game with opponent:', that.current_opponent);  // Log starting opponent
		if (that.p.color == 0) {
			that.init_turn();
		} else {
			that.opponent_move();
		}
	};

	this.run = function () {
		$('#feedback-modal button').on('click', function () {
			$('#feedback-modal').modal('hide');
			$('html').css('cursor', 'none');
			that.p.color = (that.p.color + 1) % 2;
			that.p.opponent_color = (that.p.color + 1) % 2;
			that.start_game();
		});
		that.makemove = Module.cwrap('makemove', 'number', ['number', 'string', 'string', 'number']);
		that.start_game();
	};

	this.saveGameData = function (result) {
		// Ensure result is set before saving
		that.p.currentGame.result = result;
		console.log('Saving game data with result:', result);
		if (result == null) {
			console.error('Result is null before saving game data');
		}
		// Add the current game to the list of games
		that.allGamesData.games.push({
			player_initials: that.p.initials,
			opponent_initials: that.p.opponent_initials,
			opponent: that.current_opponent,  // Track current opponent
			moves: that.p.currentGame.moves,
			result: result,
			timestamp: Date.now()
		});

		// Reset the current game data for the next game
		that.p.currentGame = {
			moves: [],
			result: null
		};
		console.log('Game data saved:', that.allGamesData.games);
		that.updateOpponent(result); // Call updateOpponent with the result directly
	};

	this.saveAllGamesData = function () {
		if (that.allGamesData.games.length === 0) {
			return Promise.resolve(); // No game data to save
		}

		// Check if username is in the session (non-authenticated user)
		const username = new URLSearchParams(window.location.search).get('username');
		if (username) {
			return fetch('/save-game-data-no-auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username: username,
					gameData: that.allGamesData
				})
			})
				.then(response => response.json())
				.then(data => {
					console.log('Success for non-authenticated user:', data);
				})
				.catch((error) => {
					console.error('Error for non-authenticated user:', error);
				});
		} else {
			return fetch('/save-game-data', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(that.allGamesData)
			})
				.then(response => response.json())
				.then(data => {
					console.log('Success for authenticated user:', data);
				})
				.catch((error) => {
					console.error('Error for authenticated user:', error);
				});
		}
	};

	this.updateOpponent = function (result) {
		// Example logic to change opponent based on performance
		console.log('Updating opponent based on result:', result);
		if (result === 'win') {
			that.current_opponent = Math.min(that.current_opponent + 1, 30);  // Increase difficulty
		} else if (result === 'loss') {
			that.current_opponent = Math.max(that.current_opponent - 1, 1);  // Decrease difficulty
		}
		console.log('Updated opponent:', that.current_opponent);  // Log updated opponent
	};

	// Save data when the window is about to be closed
	window.addEventListener('beforeunload', function () {
		if (that.allGamesData.games.length > 0) {
			that.saveAllGamesData();
		}
	});

	// Save data when the user logs out
	document.getElementById('logout-button').addEventListener('click', function (e) {
		e.preventDefault();
		if (that.allGamesData.games.length > 0) {
			that.saveAllGamesData().then(() => {
				window.location.href = '/logout';
			});
		} else {
			window.location.href = '/logout';
		}
	});
}
