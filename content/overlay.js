/**
 * Namespaces
 */
if (typeof(extensions) === 'undefined') extensions = {};
if (typeof(extensions.komodo_git) === 'undefined') extensions.komodo_git = {
	version: '1.1'
};

(function() {

	var $ = require("ko/dom"),
		notify = require("notify/notify"),
		fails = 0,
		self = this,
		uriParse = ko.uriparse,
		hidingOutput,
		prefs = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService).getBranch("extensions.komodo_git.");
		
	window.removeEventListener('komodo-post-startup', self.addGitButton);

	this.gitStatus = function() {
		var command = 'status';

		self._runOutput(command, true);

	}

	this.gitAdd = function() {
		var command = 'add -A',
			showOutput = prefs.getBoolPref('showOutput'),
			callback = showOutput ? 'status' : false;

		self._runOutput(command, false, callback);
	}
	
	this.gitReset = function() {
		var command = 'reset',
			showOutput = prefs.getBoolPref('showOutput'),
			callback = showOutput ? 'status' : false;

		self._runOutput(command, false, callback);
	}
	
	this.gitResetHard = function() {
		var command = 'reset --hard',
			showOutput = prefs.getBoolPref('showOutput'),
			callback = showOutput ? 'status' : false;

		self._runOutput(command, false, callback);
	}

	this.gitCommit = function() {
		var message = ko.interpolate.interpolateString('%(ask:commit message)'),
			showOutput = prefs.getBoolPref('showOutput');

		if (message === null) {
			return false;
		}

		var command = 'commit -m "' + message + '"';

		self._runOutput(command, showOutput);

	}

	this.gitFetch = function() {
		var command = 'fetch',
			showOutput = prefs.getBoolPref('showOutput'),
			callback = showOutput ? 'status' : false;

		self._runOutput(command, false, callback);
	}

	this.gitPull = function() {
		var command = 'pull',
			showOutput = prefs.getBoolPref('showOutput');

		self._runOutput(command, showOutput);
	}
	
	this.gitPullExt = function() {
		var message = ko.interpolate.interpolateString('%(ask:Push:origin master)'),
			showOutput = prefs.getBoolPref('showOutput');

		if (message === null) {
			return false;
		}
		
		var command = 'pull ' + message;

		self._runOutput(command, showOutput);
	}

	this.gitPush = function() {
		var message = ko.interpolate.interpolateString('%(ask:Push:origin master)');

		if (message === null) {
			return false;
		}

		var command = 'push ' + message;


		self._runOutput(command, true);
	}

	this.gitStash = function() {
		var command = 'stash';

		self._runOutput(command, true);
	}

	this.gitStashPop = function() {
		var command = 'stash pop';

		self._runOutput(command, true);
	}

	this.gitStashList = function() {
		var command = 'stash list';

		self._runOutput(command, true);
	}

	this.gitStashDrop = function() {
		var command = 'stash drop';

		self._runOutput(command, true);
	}

	this.gitDiff = function() {
		var command = 'diff';

		self._runOutput(command, true, false, true);
	}

	this.gitDiffTool = function() {
		var command = 'difftool';

		self._runOutput(command, true, false, true);
	}

	this.gitDiffStaged = function() {
		var command = 'diff --staged';

		self._runOutput(command, true, false, true);
	}

	this.gitMerge = function() {
		var command = 'merge';

		self._runOutput(command, true, false, true);
	}

	this.gitMergeTool = function() {
		var command = 'mergetool';

		self._runOutput(command, true, false, true);
	}

	this.gitRemoteList = function() {
		var command = 'remote -v';

		self._runOutput(command, true, false);
	}
	
	this.gitRemoteAdd = function() {
		var remote = ko.interpolate.interpolateString('%(ask:remote:name url)');

		if (remote === null) {
			return false;
		}

		var command = 'remote add ' + remote;

		self._runOutput(command, false, 'listRemotes');
	}

	this.gitRemoteRemove = function() {
		var remote = ko.interpolate.interpolateString('%(ask:remote:name)');

		if (remote === null) {
			return false;
		}

		var command = 'remote remove ' + remote;

		self._runOutput(command, false, 'listRemotes');
	}

	this.gitRemoteRename = function() {
		var rename = ko.interpolate.interpolateString('%(ask:rename:[old name] [new name])');

		if (rename === null) {
			return false;
		}

		var command = 'remote rename ' + rename;

		self._runOutput(command, false, 'listRemotes');
	}

	this.gitRemoteSetUrl = function() {
		var url = ko.interpolate.interpolateString('%(ask:remote:Name url)');

		if (url === null) {
			return false;
		}

		var command = 'remote set-url ' + url;

		self._runOutput(command, false, 'listRemotes');
	}

	this.gitAddFile = function() {
		var command = null;
		var koDoc = ko.views.manager.currentView.koDoc;
		
		if (koDoc === null) {
			return false;
		}
		command = 'add ' + koDoc.displayPath;
			
		if (command !== null) {
			self._runOutput(command, false, 'status');
		}
		return false;
	}
	
	this.gitDiffFile = function() {
		var command = null;
		var koDoc = ko.views.manager.currentView.koDoc;
		
		if (koDoc === null) {
			return false;
		}
		command = 'diff HEAD^ ' + koDoc.displayPath;
		
		if (command !== null) {
			self._runOutput(command, true, false, true);
		}
		return false;
	}
	
	this.gitResetFile = function() {
		var command = null;
		var koDoc = ko.views.manager.currentView.koDoc;
		
		if (koDoc === null) {
			return false;
		}
		command = 'checkout ' + koDoc.displayPath;
			
		if (command !== null) {
			self._runOutput(command, false, 'status');
		}
		
		return false;
	}
	
	this.gitAddFilePlaces = function() {
		var command = null;
		var item = ko.places.manager.getSelectedItem();
		switch (item.type) {
			case 'file':
			case 'folder':
				var file = item.file;
				if (file !== null) {
					command = 'add ' + file.displayPath;
				}
				break;
		}
		
		if (command !== null) {
			self._runOutput(command, false, 'status');
		}
		
		return false;
	}
	
	this.gitDiffFilePlaces = function() {
		var command = null;
		var item = ko.places.manager.getSelectedItem();
		switch (item.type) {
			case 'file':
			case 'folder':
				var file = item.file;
				if (file !== null) {
					command = 'diff HEAD^^ ' + file.displayPath;
				}
				break;
		}
		
		if (command !== null) {
			self._runOutput(command, true, false, true);
		}
		
		return false;
	}
	
	this.gitResetFilePlaces = function() {
		var command = null;
		var item = ko.places.manager.getSelectedItem();
		switch (item.type) {
			case 'file':
			case 'folder':
				var file = item.file;
				if (file !== null) {
					command = 'checkout ' + file.displayPath;
				}
				break;
		}
		
		if (command !== null) {
			self._runOutput(command, false, 'status');
		}
		
		return false;
	}
	

	this._runOutput = function(command, output, callback, forceOutput) {
		command = command || false;
		output = output || false;
		callback = callback || false;
		forceOutput = forceOutput || false;
		
		var path;
		var gitUrl = prefs.getCharPref('gitDirectory'),
			autoHide = prefs.getBoolPref('autoHide'),
			timeOut = 4200;
		
		if (/push\s/.test(command) || /pull\s/.test(command)) {
			timeOut = 8000;
		}
		
		if (gitUrl === 'currentProject') {
			var currentProject = ko.projects.manager.currentProject;
		
			if (currentProject === null) {
				notify.send('No current project selected', 'Tools');
				return false;
			}
	
			path = currentProject.liveDirectory;
		} else {
			var placesManger = ko.places.manager;
			
			if (placesManger !== undefined) {
				path = uriParse.displayPath(placesManger.currentPlace);
			} else {
				return false;
			}	
		}
		
		if (self.isRemote(path)) {
			notify.send('Current project is remote', 'Tools');
			return false;
		}
		
		clearTimeout(hidingOutput);

		var run = 'git -C "' + path + '" ' + command;

		ko.run.output.kill();
		setTimeout(function() {
			ko.run.command(run, {
				"runIn": (output ? 'command-output-window' : 'no-console'),
				"openOutputWindow": output,
			});
			
			if (!callback && output) {
				setTimeout(function(){
					$("#runoutput-desc-tabpanel").focus();
				}, 500);
			} else if(!callback && !output) {
				self.hideBottomPane();
			}
			
			if (autoHide && !forceOutput) {
				hidingOutput = setTimeout(function(){
					self.hideBottomPane();
				}, timeOut);
			}

			self.runCallback(callback);
		}, 10);
	}
	
	this.hideBottomPane = function(){
		if (ko.uilayout.isPaneShown('workspace_bottom_area')) {
			ko.uilayout.togglePane('workspace_bottom_area');
		}
	}
	
	this.runCMD = function(){
		ko.run.output.kill();
		setTimeout(function(){
			ko.run.command('cmd /K "cd ' + ko.interpolate.interpolateString('%i'), {});
		}, 30);
	}

	this.runCallback = function(callback) {
		if (callback) {
			setTimeout(function() {
				switch (callback) {
					case 'status':
						self.gitStatus();
						break;
					case 'listRemotes':
						self.gitRemoteList();
						break;
				}
			}, 700);
		}
	}

	this.isRemote = function(url) {
		return /(^ftp|^sftp|^ssh)/.test(url);
	}
	
	var features = "chrome,titlebar,toolbar,centerscreen";
	this.OpenSettings = function() {
		window.openDialog('chrome://komodo_git/content/pref-overlay.xul', "gitSettings", features);
	}
	
	this.addGitButton = function(){
		if ($('#gitToolbar').length > 0) {
			$('#gitToolbar').remove();
		}
		
		var defaultToolbar = $('#standard-toolbaritem2');
		var gitButton = $('<toolbarbutton id="gitButton" flex="1" class="git-icon" orient="horizontal" type="menu-button" persist="buttonstyle" buttonstyle="pictures" label="git" />'),
			gitToolbar = $('<toolbar id="gitToolbar" mode="icons" tooltiptext="Git" buttonstyle="pictures"/>'),
			gitMenu = $('<menupopup id="gitMenu" />'),
			btnGitStatus = $('<menuitem label="Git Status"	oncommand="extensions.komodo_git.gitStatus();"/>'),
			btnGitAdd = $('<menuitem label="Git Add"	oncommand="extensions.komodo_git.gitAdd();"/>'),
			btnGitReset = $('<menuitem label="Git Reset"	oncommand="extensions.komodo_git.gitReset();"/>'),
			btnGitResetHard = $('<menuitem label="Git Reset hard"	oncommand="extensions.komodo_git.gitResetHard();"/>'),
			btnGitCommit = $('<menuitem label="Git Commit"	oncommand="extensions.komodo_git.gitCommit();"/>'),
			btnGitFetch = $('<menuitem label="Git Fetch"	oncommand="extensions.komodo_git.gitFetch();"/>'),
			btnGitPull = $('<menuitem label="Git Pull"	oncommand="extensions.komodo_git.gitPullExt();"/>'),
			btnGitPush = $('<menuitem label="Git Push"	oncommand="extensions.komodo_git.gitPush();"/>'),
			btnGitStash = $('<menuitem label="Git Stash"	oncommand="extensions.komodo_git.gitStash();"/>'),
			btnGitStashPop = $('<menuitem label="Git Stash pop"	oncommand="extensions.komodo_git.gitStashPop();"/>'),
			btnGitStashList = $('<menuitem label="Git Stash list"	oncommand="extensions.komodo_git.gitStashList();"/>'),
			btnGitStashDrop = $('<menuitem label="Git Stash drop"	oncommand="extensions.komodo_git.gitStashDrop();"/>'),
			btnGitDiff = $('<menuitem label="Git Diff"	oncommand="extensions.komodo_git.gitDiff();"/>'),
			btnGitDiffTool = $('<menuitem label="Git Difftool"	oncommand="extensions.komodo_git.gitDiffTool();"/>'),
			btnGitDiffStaged = $('<menuitem label="Git Diff staged"	oncommand="extensions.komodo_git.gitDiffStaged();"/>'),
			btnGitMerge = $('<menuitem label="Git Merge"	oncommand="extensions.komodo_git.gitMerge();"/>'),
			btnGitMergeTool = $('<menuitem label="Git Mergetool"	oncommand="extensions.komodo_git.gitMergeTool();"/>'),
			btnGitRemoteList = $('<menuitem label="Git Remote list"	oncommand="extensions.komodo_git.gitRemoteList();"/>'),
			btnGitRemoteAdd = $('<menuitem label="Git Remote add"	oncommand="extensions.komodo_git.gitRemoteAdd();"/>'),
			btnGitRemoteRemove = $('<menuitem label="Git Remote remove"	oncommand="extensions.komodo_git.gitRemoteRemove();"/>'),
			btnGitRemoteRename = $('<menuitem label="Git Remote rename"	oncommand="extensions.komodo_git.gitRemoteRename();"/>'),
			btnGitRemoteSetUrl = $('<menuitem label="Git Remote set url"	oncommand="extensions.komodo_git.gitRemoteSetUrl();"/>'),
			btnGitAddFile = $('<menuitem label="Git Add file"	oncommand="extensions.komodo_git.gitAddFile();"/>'),
			btnGitDiffFile = $('<menuitem label="Git Diff file"	oncommand="extensions.komodo_git.gitDiffFile();"/>'),
			btnGitResetFile = $('<menuitem label="Git Reset file"	oncommand="extensions.komodo_git.gitResetFile();"/>'),
			btnGitRunCmd = $('<menuitem label="Run CMD"	oncommand="extensions.komodo_git.runCMD();"/>'),
			btnSettings = $('<menuitem label="Settings"	oncommand="extensions.komodo_git.OpenSettings();"/>'),
			stashMenu = $('<menu label="Git Stash" />'),
			stashPop = $('<menupopup />'),
			diffMenu = $('<menu label="Git Diff" />'),
			diffPop = $('<menupopup />'),
			mergeMenu = $('<menu label="Git Merge" />'),
			mergePop = $('<menupopup />'),
			remoteMenu = $('<menu label="Git Remote" />'),
			remotePop = $('<menupopup />');
			
			
		gitMenu.append(btnGitStatus);
		gitMenu.append(btnGitAdd);
		gitMenu.append(btnGitReset);
		gitMenu.append(btnGitResetHard);
		gitMenu.append(btnGitCommit);
		gitMenu.append(btnGitFetch);
		gitMenu.append(btnGitPull);
		gitMenu.append(btnGitPush);
		
		stashPop.append(btnGitStash);
		stashPop.append(btnGitStashList);
		stashPop.append(btnGitStashPop);
		stashPop.append(btnGitStashDrop);
		stashMenu.append(stashPop);
		
		gitMenu.append(stashMenu);
		
		diffPop.append(btnGitDiff);
		diffPop.append(btnGitDiffTool);
		diffPop.append(btnGitDiffStaged);
		diffMenu.append(diffPop);
		
		gitMenu.append(diffMenu);
		
		mergePop.append(btnGitMerge);
		mergePop.append(btnGitMergeTool);
		mergeMenu.append(mergePop);
		
		gitMenu.append(mergeMenu);
		
		remotePop.append(btnGitRemoteList);
		remotePop.append(btnGitRemoteAdd);
		remotePop.append(btnGitRemoteRemove);
		remotePop.append(btnGitRemoteRename);
		remotePop.append(btnGitRemoteSetUrl);
		remoteMenu.append(remotePop);
		
		gitMenu.append(remoteMenu);
		
		gitMenu.append(btnGitRunCmd);
		gitMenu.append(btnSettings);
		
		gitButton.append(gitMenu);
		gitToolbar.append(gitButton);
		if (defaultToolbar.length > 0) {
			defaultToolbar.after(gitToolbar);
			fails = 0;
		} else if(fails < 10) {
			fails++;
			setTimeout(function(){
				self.addGitButton();
			}, 1000);
		}
		
		return false;
	}
	
	window.addEventListener('komodo-post-startup', self.addGitButton);
	
}).apply(extensions.komodo_git);




