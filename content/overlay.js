/**
 * Namespaces
 */
if (typeof(extensions) === 'undefined') extensions = {};
if (typeof(extensions.komodo_git) === 'undefined') extensions.komodo_git = {
	version: '1.1.2'
};

(function() {

	var $ 				= require("ko/dom"),
		notify 			= require("notify/notify"),
		shell			= require("ko/shell"),
		fails 			= 0,
		self 			= this,
		uriParse 		= ko.uriparse,
		obs 			= Components.classes["@mozilla.org/observer-service;1"]
						.getService(Components.interfaces.nsIObserverService),
		hidingOutput,
		prefs 			= Components.classes["@mozilla.org/preferences-service;1"]
						.getService(Components.interfaces.nsIPrefService).getBranch("extensions.komodo_git.");
		
	window.removeEventListener('komodo-post-startup', self.addGitButton);

	this.gitStatus = () => {
		var command = 'status';

		self._runOutput(command, true);

	}
	
	this.gitInit = () => {
		var command = 'init',
			callback = 'status';

		self._runOutput(command, callback);
	}

	this.gitAdd = () => {
		var command = 'add -A',
			callback = 'status';

		self._runOutput(command, callback);
	}
	
	this.gitReset = () => {
		var command = 'reset',
			callback = 'status';

		self._runOutput(command, callback);
	}
	
	this.gitResetHard = () => {
		var command = 'reset --hard',
			callback = 'status';

		self._runOutput(command, callback);
	}

	this.gitCommit = () => {
		var message = ko.interpolate.interpolateString('%(ask:commit message)');

		if (message === null) {
			return false;
		}

		var command = 'commit -m "' + message + '"';

		self._runOutput(command);

	}

	this.gitFetch = () => {
		var command = 'fetch',
			callback = 'status';

		self._runOutput(command, callback);
	}

	this.gitPull = () => {
		var command = 'pull';

		self._runOutput(command);
	}
	
	this.gitPullExt = () => {
		var message = ko.interpolate.interpolateString('%(ask:Push:origin master)');

		if (message === null) {
			return false;
		}
		
		var command = 'pull ' + message;

		self._runOutput(command);
	}

	this.gitPush = () => {
		var message = ko.interpolate.interpolateString('%(ask:Push:origin master)');

		if (message === null) {
			return false;
		}

		var command = 'push ' + message;


		self._runOutput(command);
	}

	this.gitStash = () => {
		var command = 'stash';

		self._runOutput(command);
	}

	this.gitStashPop = () => {
		var command = 'stash pop';

		self._runOutput(command);
	}

	this.gitStashList = () => {
		var command = 'stash list';

		self._runOutput(command);
	}

	this.gitStashDrop = () => {
		var command = 'stash drop';

		self._runOutput(command);
	}

	this.gitDiff = () => {
		var command = 'diff';

		self._runOutput(command, false, true);
	}

	this.gitDiffTool = () => {
		var command = 'difftool';

		self._runOutput(command, false, true);
	}

	this.gitDiffStaged = () => {
		var command = 'diff --staged';

		self._runOutput(command, false, true);
	}

	this.gitMerge = () => {
		var command = 'merge';

		self._runOutput(command, false, true);
	}

	this.gitMergeTool = () => {
		var command = 'mergetool';

		self._runOutput(command, false, true);
	}

	this.gitRemoteList = () => {
		var command = 'remote -v';

		self._runOutput(command, true, false);
	}
	
	this.gitRemoteAdd = () => {
		var remote = ko.interpolate.interpolateString('%(ask:remote:name url)');

		if (remote === null) {
			return false;
		}

		var command = 'remote add ' + remote;

		self._runOutput(command, 'listRemotes');
	}

	this.gitRemoteRemove = () => {
		var remote = ko.interpolate.interpolateString('%(ask:remote:name)');

		if (remote === null) {
			return false;
		}

		var command = 'remote remove ' + remote;

		self._runOutput(command, 'listRemotes');
	}

	this.gitRemoteRename = () => {
		var rename = ko.interpolate.interpolateString('%(ask:rename:[old name] [new name])');

		if (rename === null) {
			return false;
		}

		var command = 'remote rename ' + rename;

		self._runOutput(command, 'listRemotes');
	}

	this.gitRemoteSetUrl = () => {
		var url = ko.interpolate.interpolateString('%(ask:remote:Name url)');

		if (url === null) {
			return false;
		}

		var command = 'remote set-url ' + url;

		self._runOutput(command, 'listRemotes');
	}

	this.gitAddFile = () => {
		var command = null;
		var koDoc = ko.views.manager.currentView.koDoc;
		
		if (koDoc === null) {
			return false;
		}
		command = 'add ' + koDoc.displayPath;
			
		if (command !== null) {
			self._runOutput(command, 'status');
		}
		return false;
	}
	
	this.gitDiffFile = () => {
		var command = null;
		var koDoc = ko.views.manager.currentView.koDoc;
		
		if (koDoc === null) {
			return false;
		}
		command = 'diff HEAD~1 ' + koDoc.displayPath;
		
		if (command !== null) {
			self._runOutput(command, false, true);
		}
		return false;
	}
	
	this.gitResetFile = () => {
		var command = null;
		var koDoc = ko.views.manager.currentView.koDoc;
		
		if (koDoc === null) {
			return false;
		}
		command = 'checkout ' + koDoc.displayPath;
			
		if (command !== null) {
			self._runOutput(command, 'status');
		}
		
		return false;
	}
	
	this.gitAddFilePlaces = () => {
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
			self._runOutput(command, 'status');
		}
		
		return false;
	}
	
	this.gitDiffFilePlaces = () => {
		var command = null;
		var item = ko.places.manager.getSelectedItem();
		switch (item.type) {
			case 'file':
			case 'folder':
				var file = item.file;
				if (file !== null) {
					command = 'diff HEAD~1 ' + file.displayPath;
				}
				break;
		}
		
		if (command !== null) {
			self._runOutput(command, false, true);
		}
		
		return false;
	}
	
	this.gitResetFilePlaces = () => {
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
			self._runOutput(command, 'status');
		}
		
		return false;
	}
	

	this._runOutput = (command, callback, forceOutput) => {
		command = command || false;
		callback = callback || false;
		forceOutput = forceOutput || false;
		
		var path;
		var gitUrl = prefs.getCharPref('gitDirectory'),
			autoHide = prefs.getBoolPref('autoHide'),
			timeOut = 4200;
		
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
		
		shell.exec(
			run,
			 {
				"runIn": 'command-output-window',
				"openOutputWindow": false,
			},
			function(error, stdout, stderr) {
				if (error !== null) {
					ko.uilayout.toggleTab('git-console-widget', false);
					try {
						obs.notifyObservers({
							wrappedJSObject: {
								level: "error",
								arguments: [ stderr ],
							},
						},
						'git-console-log-event', null);	
					} catch(e) {
						console.log(e);
					}
				} else {
					console.log(stderr);
					if (stdout.length > 0) {
						ko.uilayout.toggleTab('git-console-widget', false);
						try {
						obs.notifyObservers({
								wrappedJSObject: {
									level: "debug",
									arguments: [ stdout ],
								},
							},
							'git-console-log-event', null);	
						} catch(e) {
							console.log(e);
						}
					}
					if (callback) {
						self.runCallback(callback);
					}
				}
				if (autoHide && !forceOutput) {
					hidingOutput = setTimeout(function(){
						self.hideBottomPane();
					}, timeOut);
				}
			}
		);
	}
	
	this.hideBottomPane = () => {
		if (ko.uilayout.isPaneShown('workspace_bottom_area')) {
			ko.uilayout.togglePane('workspace_bottom_area');
		}
	}
	
	this.runCMD = () => {
		var currentProject = ko.projects.manager.currentProject;
		var placesManger = ko.places.manager;
		var directory = ko.uriparse.displayPath(placesManger.currentPlace);
		ko.run.output.kill();
		if (currentProject !== null && prefs.getCharPref('gitDirectory') === 'currentProject') {
			directory = ko.interpolate.interpolateString('%i');
		} 
		setTimeout(function(){
			ko.run.command('cmd /K "cd ' + directory, {});
		}, 30);
	}

	this.runCallback = (callback) => {
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

	this.isRemote = (url) => {
		return /(^ftp|^sftp|^ssh)/.test(url);
	}
	
	var features = "chrome,titlebar,toolbar,centerscreen";
	this.OpenSettings = () => {
		window.openDialog('chrome://komodo_git/content/pref-overlay.xul', "gitSettings", features);
	}
	
	this._addDynamicToolbarButton = () => {
		const db = require('ko/dynamic-button');

		const view = () => {
			return ko.views.manager.currentView && ko.views.manager.currentView.title !== "New Tab";
		};
		
		const button = db.register({
			label: "Komodo Git",
			tooltip: "Komodo Git",
			icon: "scc",
			events: [
				"current_view_changed",
			],
			menuitems: [
				{
					label: "Git Status",
					name: "git_status",
					command: () => {
						extensions.komodo_git.gitStatus();
					}
				},
				{
					label: "Git Init",
					name: "git_init",
					command: () => {
						extensions.komodo_git.gitInit();
					}
				},
				{
					label: "Git Add",
					name: "git_add",
					command: () => {
						extensions.komodo_git.gitAdd();
					}
				},
				{
					label: "Git Reset",
					name: "git_reset",
					command: () => {
						extensions.komodo_git.gitReset();
					}
				},
				{
					label: "Git Reset hard",
					name: "git_reset_hard",
					command: () => {
						extensions.komodo_git.gitResetHard();
					}
				},
				{
					label: "Git Commit",
					name: "git_commit",
					command: () => {
						extensions.komodo_git.gitCommit();
					}
				},
				{
					label: "Git Fetch",
					name: "git_fetch",
					command: () => {
						extensions.komodo_git.gitFetch();
					},
				},
				{
					label: "Git Pull",
					name: "git_pull",
					command: () => {
						extensions.komodo_git.gitPullExt();
					},
				},
				{
					label: "Git Push",
					name: "git_push",
					command: () => {
						extensions.komodo_git.gitPush();
					},
				},
				{
					label: "Git Stash",
					name: "git_stash",
					menuitems: [
						{
							label: "Git Stash",
							name: "git_stash",
							command: () => {
								extensions.komodo_git.gitStash();
							},
						},
						{
							label: "Git Stash Pop",
							name: "git_stash_pop",
							command: () => {
								extensions.komodo_git.gitStashPop();
							},
						},
						{
							label: "Git Stash List",
							name: "git_stash_list",
							command: () => {
								extensions.komodo_git.gitStashList();
							},
						},
						{
							label: "Git Stash Drop",
							name: "git_stash_drop",
							command: () => {
								extensions.komodo_git.gitStashDrop();
							},
						},
					]
				},
				{
					label: "Git Diff",
					name: "git_diff",
					menuitems: [
						{
							label: "Git Diff",
							name: "git_diff",
							command: () => {
								extensions.komodo_git.gitDiff();
							},
						},
						{
							label: "Git Difftool",
							name: "git_difftool",
							command: () => {
								extensions.komodo_git.gitDiffTool();
							},
						},
						{
							label: "Git Diff Staged",
							name: "git_diff_staged",
							command: () => {
								extensions.komodo_git.gitDiffStaged();
							},
						},
					]
				},
				{
					label: "Git Merge",
					name: "git_merge",
					menuitems: [
						{
							label: "Git Merge",
							name: "git_merge",
							command: () => {
								extensions.komodo_git.gitMerge();
							},
						},
						{
							label: "Git Mergetool",
							name: "git_mergetool",
							command: () => {
								extensions.komodo_git.gitMergeTool();
							},
						},
						{
							label: "Git Diff Staged",
							name: "git_diff_staged",
							command: () => {
								extensions.komodo_git.gitDiffStaged();
							},
						},
					]
				},
				{
					label: "Git Remote",
					name: "git_remote",
					menuitems: [
						{
							label: "Git Remote List",
							name: "git_remote_list",
							command: () => {
								extensions.komodo_git.gitRemoteList();
							},
						},
						{
							label: "Git Remote add",
							name: "git_remote_add",
							command: () => {
								extensions.komodo_git.gitRemoteAdd();
							},
						},
						{
							label: "Git Remote Remove",
							name: "git_remote_remove",
							command: () => {
								extensions.komodo_git.gitDiffStaged();
							},
						},
						{
							label: "Git Remote Rename",
							name: "git_remote_rename",
							command: () => {
								extensions.komodo_git.gitRemoteRename();
							},
						},
						{
							label: "Git Remote Set Url",
							name: "git_remote_set_url",
							command: () => {
								extensions.komodo_git.gitRemoteSetUrl();
							},
						},
					]
				},
				{
					label: "Run CMD",
					name: "run_cmd",
					command: () => {
						extensions.komodo_git.runCMD();
					},
				},
				{
					label: "Settings",
					name: "git-settings",
					command: () => {
						extensions.komodo_git.OpenSettings();
					}
				},
			],
			isEnabled: () => {
				return view();
			},
		});
	};
	self._addDynamicToolbarButton();
	
}).apply(extensions.komodo_git);




