const Discord = require('discord.js');
const api = require("twitch-helix-api");
const request = require('request');
const bot = new Discord.Client();
const settings = require("./settings.json");
const fs = require('fs');
const PREFIX = "<@451372953008078849>";

const COMMANDS_ADMINISTRATOR = ["commandes","live","chaine", "annonces","administrateur","sub_administrateur", "intervalle", "info"];
var HELP_COMMANDS_ADMINISTRATOR = new Object();
	HELP_COMMANDS_ADMINISTRATOR["commandes"]=" -> Je fourni la liste des commandes possibles \n \t *exemple : "+PREFIX+" commandes *";
	HELP_COMMANDS_ADMINISTRATOR["live"]=" -> J'annonce un live de facon manuelle \n \t *exemple : "+PREFIX+" live *";
	HELP_COMMANDS_ADMINISTRATOR["chaine"]=" -> On change la chaine Twitch pour les annonces ? \n \t *exemple : "+PREFIX+" chaine nom_chaine *";
	HELP_COMMANDS_ADMINISTRATOR["annonces"]=" -> On change le channel discord pour les annonces ? \n \t *exemple : "+PREFIX+" annonces id_channel *";
	HELP_COMMANDS_ADMINISTRATOR["administrateur"]=" -> On change d'administrateur ? \n \t *exemple : "+PREFIX+" administrateur id_user *  \n \t *exemple : "+PREFIX+" administrateur @user *";
	HELP_COMMANDS_ADMINISTRATOR["sub_administrateur"]=" -> Ajoute ou enleve un sous administrateur \n \t *exemple : "+PREFIX+" subadministrateur id_user *  \n \t *exemple : "+PREFIX+" sub_administrateur @user *";
	HELP_COMMANDS_ADMINISTRATOR["intervalle"]=" -> On change la durée pour la vérification du stream Twitch ? \n \t *exemple : "+PREFIX+" intervalle temps (en minutes) *";
	HELP_COMMANDS_ADMINISTRATOR["info"]=" -> Fourni des informations sur le serveur, l'administrateur, etc \n \t *exemple : "+PREFIX+" info *";

var TEXT_COMMANDS_ADMINISTRATOR = "Voici ma liste de commandes pour administrateur:";

const COMMANDS_SUBADMINISTRATOR = ["commandes","live","chaine", "annonces","sub_administrateur", "intervalle", "info"];
var HELP_COMMANDS_SUBADMINISTRATOR = new Object();
	HELP_COMMANDS_SUBADMINISTRATOR["commandes"]=" -> Je fourni la liste des commandes possibles \n \t *exemple : "+PREFIX+" commandes *";
	HELP_COMMANDS_SUBADMINISTRATOR["live"]=" -> J'annonce un live de facon manuelle \n \t *exemple : "+PREFIX+" live *";
	HELP_COMMANDS_SUBADMINISTRATOR["chaine"]=" -> On change la chaine Twitch pour les annonces ? \n \t *exemple : "+PREFIX+" chaine nom_chaine *";
	HELP_COMMANDS_SUBADMINISTRATOR["annonces"]=" -> On change le channel discord pour les annonces ? \n \t *exemple : "+PREFIX+" annonces id_channel *";
	HELP_COMMANDS_SUBADMINISTRATOR["sub_administrateur"]=" -> Ajoute ou enleve un sous administrateur \n \t *exemple : "+PREFIX+" subadministrateur id_user *  \n \t *exemple : "+PREFIX+" sub_administrateur @user *";
	HELP_COMMANDS_SUBADMINISTRATOR["intervalle"]=" -> On change la durée pour la vérification du stream Twitch ? \n \t *exemple : "+PREFIX+" info *";
var TEXT_COMMANDS_SUBADMINISTRATOR = "Voici ma liste de commandes pour administrateur:";

api.clientID = process.env.BOT_TOKEN;

var SERVERS_ID = settings["servers_id"];
var SERVERS = JSON.parse(settings["servers"]);

for(i = 0; i < SERVERS_ID.length ; i++)
{
	var aServer = findServer(SERVERS,SERVERS_ID[0]);
}

for(i = 0 ; i < COMMANDS_ADMINISTRATOR.length; i++)
{
	TEXT_COMMANDS_ADMINISTRATOR = TEXT_COMMANDS_ADMINISTRATOR+"\n **"+COMMANDS_ADMINISTRATOR[i]+"** "+HELP_COMMANDS_ADMINISTRATOR[COMMANDS_ADMINISTRATOR[i]];
}

for(i = 0 ; i < COMMANDS_SUBADMINISTRATOR.length; i++)
{
	TEXT_COMMANDS_SUBADMINISTRATOR = TEXT_COMMANDS_SUBADMINISTRATOR+"\n **"+COMMANDS_SUBADMINISTRATOR[i]+"** "+HELP_COMMANDS_SUBADMINISTRATOR[COMMANDS_SUBADMINISTRATOR[i]];
}
bot.on("ready",function()
{
	
	
	console.log("Ready");
});

function isKnownServer(id)
{
	if((SERVERS.find(val => val.id==id)== undefined)||(SERVERS.find(val => val.id==id)== null))
	{
		return false;
	}
	else
	{
		return true;
	}
}

function findServer(id)
{
	var aServer = SERVERS.find(val => val.id==id);
	return aServer;
}

function addServer(server)
{
	SERVERS_ID.push(server.id);
	var aServer = {};
	aServer['id']=server.id;
	aServer['administrator']=server.ownerID;
	aServer['sub_administrators']=[];
	aServer['image_size']=280;
	aServer['time_between']=5*1000;
	aServer['channel']=server.defaultChannel;
	aServer['checked_live']=false;
	aServer['date_live']=0;
	SERVERS.push(aServer);
	saveModification();
}

function saveModification()
{
	console.log(SERVERS_ID);
	console.log(SERVERS);
	var tmpData = {"token":settings["token"],
		"servers_id":SERVERS_ID,
		"bot_name":"Botemus",
		"servers":JSON.stringify(SERVERS)
	};
	data = JSON.stringify(tmpData);
	fs.writeFile("./settings.json", data, function(err) {
    if (err) {
        console.log(err);
    }
	});
}

function getCount(list, aValue)
{
	count=0;
	for(var i=0;i<list.length;i++)
	{
		if(list[i]==aValue)
		{
			count=count+1;
		}
	}
	return count;
}

function unique(list) 
{
	var uniqueValues =[];
	uniqueValues.push(list[0]);
    for(var i=1;i<list.length;i++)
	{
		if(list[i]!=list[i-1])
		{
			uniqueValues.push(list[i]);
		}
	}
	return uniqueValues;
}

function contains(list, aValue)
{
	var res = false;
	
	for(i = 0; i < list.length; i++)
	{
		if(list[i]==aValue)
		{
			res = true;
		}
	}
	return res;
}

function checkLive(id)
{
	var aServer = findServer(id);
	var channel = bot.channels.find('id', aServer["channel"]);
	request('https://api.twitch.tv/kraken/streams?channel='+aServer["twitch"]+'&client_id='+api.clientID, function (error, response, body) {
		var json = JSON.parse(body);
		
		console.log(json);
		if((json["_total"]>=1)&&(aServer["checked_live"]==false)&&(Date.now()-aServer["date_live"]>aServer["time_between"]))
		{
			var urlGame = "";
			api.games.getGames({name: json["streams"][0]["channel"]["game"]}).then(function(data) {
				console.log(data["response"]["data"][0]["box_art_url"]);
				urlGame = data["response"]["data"][0]["box_art_url"];
				urlGame = urlGame.replace("{width}",aServer['image_size']);
				urlGame = urlGame.replace("{height}",aServer['image_size']);
				const embed = new Discord.RichEmbed().
					setTitle(json["streams"][0]["channel"]["game"]).
					setAuthor(json["streams"][0]["channel"]["status"]).
					setThumbnail(json["streams"][0]["channel"]["logo"]).
					setURL(json["streams"][0]["channel"]["url"]).
					setImage(urlGame);
				aServer["checked_live"]=true;
				aServer["date_live"] = Date.now();
				channel.send("@everyone");
				channel.send(embed);
				saveModification();
			});
			
		}
		else
		{
			if((json["_total"]>=1)&&(aServer["checked_live"]==true))
			{
				aServer["checked_live"]=true;
				aServer["date_live"] = Date.now();
				saveModification();	
			}
			else
			{
				aServer["checked_live"]=false;
				saveModification();
			}
		}
	});
}

function changeChaine(id,name)
{
	if(isKnownServer(id))
	{
		var aServer = findServer(id);
		aServer["twitch"] = name;
		saveModification();
		return "La chaine twitch a été changée à "+name;
	}
	else
	{
		return "Erreur lors du changement de la chaine Twitch : votre serveur n'est pas connu par le bot.";
	}
}

function changeAnnonces(id,name)
{
	if(isKnownServer(id))
	{
		if(isNaN(name)==false)
		{
			var aServer = findServer(id);
			aServer["channel"] = name;
			saveModification();
			return "Le channel pour les annonces a été changé à "+name;
		}
		else
		{
			return "Erreur lors du changement de channel, veuillez verifier que "+name+" est bien l'ID d'un channel";
		}
	}
	else
	{
		return "Erreur lors du changement de channel : votre serveur n'est pas connu par le bot.";
	}
	
}

function changeAdministrateur(id,name)
{
	if(isKnownServer(id))
	{
		var aServer = findServer(id);
		var theUser = name;
		if(name.startsWith("<@"))
		{
			name = name.replace("<@","");
			name = name.replace(">","");
			theUser = name;
		}
		else
		{
			if(name.startsWith("@"))
			{
				name = name.replace("@","");
				names = name.split("#");
				console.log(names);
				theUser = bot.users.find(val => ((val.username===names[0]) && (val.discriminator===names[1]))).id;
			}
		}
		aServer["administrator"] = name;
		saveModification();
		return "L'administrateur a bien été changé, il s'agit désormais de "+name;
	}
	else
	{
		return "Erreur lors du changement d'administrateur : votre serveur n'est pas connu par le bot.";
	}
	
}

function changeSubAdministrateur(id,name)
{
	if(isKnownServer(id))
	{
		var aServer = findServer(id);
		var theUser = name;
		if(name.startsWith("<@"))
		{
			name = name.replace("<@","");
			name = name.replace(">","");
			theUser = name;
		}
		else
		{
			if(name.startsWith("@"))
			{
				name = name.replace("@","");
				names = name.split("#");
				console.log(names);
				theUser = bot.users.find(val => ((val.username===names[0]) && (val.discriminator===names[1]))).id;
			}
		}
		if(contains(aServer["sub_administrators"],theUser))
		{
			var index = aServer["sub_administrators"].indexOf(theUser);
			if (index > -1) {
				aServer["sub_administrators"].splice(index, 1);
				saveModification();
				return "Le sous administrateur "+theUser+" a été retiré";
			}
		}
		else
		{
			aServer["sub_administrators"].push(theUser);
			saveModification();
			return "Le sous administrateur "+theUser+" a été ajouté";
		}
	}
	else
	{
		return "Erreur lors de la modification des sous administrateur : votre serveur n'est pas connu par le bot.";
	}
	
}

function changeIntervalle(id,time)
{
	if(isKnownServer(id))
	{
		var aServer = findServer(id);
		if(isNaN(time)==false)
		{
			aServer["time_between"] = time*1000;
			saveModification();
			return "L'intervalle entre deux annonces a bien été changé, il est maintenant de "+time+" minutes";
		}
		else
		{
			return "Erreur lors du changement de l'intervalle entre deux annonces : veuillez verifier que vous avez passé un nombre";
		}
	}
	else
	{
		return "Erreur lors du changement de l'intervalle : votre serveur n'est pas connu par le bot.";
	}
	
}

setInterval(function() {
	for(i = 0; i < SERVERS_ID.length ; i++)
	{
		checkLive(SERVERS_ID[i]);
	}
}, 60 * 1000); // Check every minute

bot.on("message",function(message)
{
	if(message.author.equals(bot.user))
	{
		return;
	}
	if(!message.content.startsWith(PREFIX))
	{
		return;
	}
	if(message.guild==undefined ||message.guild==null)
	{
		return;
	}
	
	console.log(message.content);
	console.log(message.guild.id);
	if(isKnownServer(message.guild.id)==false)
	{
		addServer(message.guild);
	}
	
	var aServer = findServer(message.guild.id);
	
	if(message.author.id == aServer["administrator"])
	{
		var args = message.content.substring(PREFIX.length).split(" ");
		if(args.length>1)
		{
			switch (args[1].toLowerCase())
			{
				case COMMANDS_ADMINISTRATOR[0]:
					message.author.send(new Discord.RichEmbed().setTitle("Commandes Administrateur").setDescription(TEXT_COMMANDS_ADMINISTRATOR));
					break;
				case COMMANDS_ADMINISTRATOR[1]:
					checkLive(message.guild.id);
					break;
				case COMMANDS_ADMINISTRATOR[2]:
					if(args.length>2)
					{
						changeChaine(message.guild.id,args[2]);
					}
					break;
				case COMMANDS_ADMINISTRATOR[3]:
					if(args.length>2)
					{
						changeAnnonces(message.guild.id,args[2]);
					}
					break;
				case COMMANDS_ADMINISTRATOR[4]:
					if(args.length>2)
					{
						changeAdministrateur(message.guild.id,args[2]);
					}
					break;
				case COMMANDS_ADMINISTRATOR[5]:
					if(args.length>2)
					{
						changeSubAdministrateur(message.guild.id,args[2]);
					}
					break;
				case COMMANDS_ADMINISTRATOR[6]:
					if(args.length>2)
					{
						changeIntervalle(message.guild.id,args[2]);
					}
					break;
				case COMMANDS_ADMINISTRATOR[7]:
					var text = "Administrateur: "+bot.users.find("id", aServer["administrator"])+" ("+aServer["administrator"]+")";
					text += "\nSous Administrateur: ";
					for(i=0; i<aServer["sub_administrators"].length;i++)
					{
						text += bot.users.find("id", aServer["sub_administrators"][i])+" ("+aServer["sub_administrators"][i]+")";
					}
					text += "\nChaine Twitch: "+aServer["twitch"];
					var channel = message.channel;
					text += "\nChannel Annonces: "+channel.name +" ("+aServer["channel"]+")";
					text += "\nTemps minimum entre les annonces (en min) : "+aServer["time_between"]/1000;
					message.author.send(new Discord.RichEmbed().addField("Informations supplémentaires",text));
					break;
				default:
					break;
			}
		}
	}
	else
	{
		if(contains(aServer["sub_administrators"],message.author.id))
		{
			var args = message.content.substring(PREFIX.length).split(" ");
			if(args.length>1)
			{
				switch (args[1].toLowerCase())
				{
					case COMMANDS_SUBADMINISTRATOR[0]:
						message.author.send(new Discord.RichEmbed().addField("Commandes Sous Administrateur",TEXT_COMMANDS_SUBADMINISTRATOR));
					case COMMANDS_SUBADMINISTRATOR[1]:
						checkLive(message.guild.id);
					case COMMANDS_SUBADMINISTRATOR[2]:
						if(args.length>2)
						{
							changeChaine(message.guild.id,args[2]);
						}
					case COMMANDS_SUBADMINISTRATOR[3]:
						if(args.length>2)
						{
							changeAnnonces(message.guild.id,args[2]);
						}
						break;
					case COMMANDS_SUBADMINISTRATOR[4]:
						if(args.length>2)
						{
							changeSubAdministrateur(message.guild.id,args[2]);
						}
						break;
					case COMMANDS_SUBADMINISTRATOR[5]:
						if(args.length>2)
						{
							changeIntervalle(message.guild.id,args[2]);
						}
						break;
					case COMMANDS_SUBADMINISTRATOR[6]:
						var text = "Administrateur: "+bot.users.find("id", aServer["administrator"])+" ("+aServer["administrator"]+")";
						text += "\nSous Administrateur: ";
						for(i=0; i<aServer["sub_administrators"].length;i++)
						{
							text += bot.users.find("id", aServer["sub_administrators"][i])+" ("+aServer["sub_administrators"][i]+")";
						}
						text += "\nChaine Twitch: "+aServer["twitch"];
						var channel = message.channel;
						text += "\nChannel Annonces: "+channel.name +" ("+aServer["channel"]+")";
						text += "\nTemps minimum entre les annonces (en min) : "+aServer["time_between"]/1000;
						message.author.send(new Discord.RichEmbed().addField("Informations supplémentaires",text));
					default:
						break;
				}
			}
		}
	}
	
	
});
bot.login(process.env.BOT_TOKEN);
