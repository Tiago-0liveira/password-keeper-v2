import "core-js/stable";
import "regenerator-runtime/runtime";
import { app, BrowserWindow, ipcMain } from "electron"
import * as path from "path"
import * as url from "url"

import { getRows, deleteRow, newRow, updateRow } from "./database/database";
import { winUsers, shutDownSteam, getSteamProcess, runasUser } from "./steam"
import { steamICO } from "./Images";
import { validateNewRow } from "./helpers";

let mainWindow: Electron.BrowserWindow | null

app.allowRendererProcessReuse = true
let steamTaskRan = false
app.setJumpList([
	{
		name: 'Steam Accounts',
		items: winUsers.map((user, i) => {
			return {
				type: 'task',
				title: user,
				program: process.execPath,
				args: `--run-steam=${user}`,
				iconIndex: i,
				iconPath: steamICO,
				description: `Opens steam as ${user}`
			}
		})
	}
])
let steamSwitch = app.commandLine.getSwitchValue("run-steam")
if (winUsers.includes(steamSwitch)) {
	steamTaskRan = true
	getSteamProcess().then(async ({ running }) => {
		if (running) await shutDownSteam()
		await runasUser(steamSwitch)
		process.exit(0)
	}).catch(console.log)
}

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1050,
		height: 650,
		backgroundColor: "#191622",
		center: true,
		frame: false,
		title: "Password Keeper",
		minWidth: 1050,
		minHeight: 600,
		icon: "./build/vault.png",
		webPreferences: {
			nodeIntegration: true,
			//contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	})

	if (process.env.NODE_ENV === "development") {
		mainWindow.loadURL("http://localhost:4000")
	} else {
		mainWindow.loadURL(url.format({
			pathname: path.join(__dirname, "renderer/index.html"),
			protocol: "file:",
			slashes: true
		}))
	}

	mainWindow.on("closed", () => {
		mainWindow = null
	})
}

!steamTaskRan && app.on("ready", createWindow)
	.whenReady()
	.then(() => {
		if (process.env.NODE_ENV === "development") {
			import("electron-devtools-installer").then(module => {
				module.default(module.REACT_DEVELOPER_TOOLS)
					.then((name) => console.log(`Added Extension:  ${name}`))
					.catch((err) => console.log("An error occurred: ", err))
			}).catch(console.error)
		}

	})
console.log("here")

ipcMain.handle("requestGetRows", async (event, data: GetRowsData) => {
	const rows: Row[] = await getRows(data.query, data.sort)
	if (process.env.NODE_ENV === "development") {
		console.log(`ipcMain||getRows||${rows.length} rows`)
	}
	return rows
	/*event.reply("responseGetRows", rows)*/
})
ipcMain.handle("requestNewRow", async (event, data: NewRowData) => {
	if (process.env.NODE_ENV === "development") {
		console.log(`ipcMain||newRow||${JSON.stringify(data, null, 0)}`)
	}
	return await newRow(data)/*.then(async () => {
		event.reply("responseGetRows", await getRows())
	});*/
})
ipcMain.handle("requestDeleteRow", async (event, data: { uuid: number }) => {
	if (process.env.NODE_ENV === "development") {
		console.log(`ipcMain||deleteRow||${JSON.stringify(data, null, 0)}`)
	}
	return await deleteRow({ uuid: data.uuid })
	/*event.reply("responseDeleteRow", await deleteRow({ uuid: data.uuid }))*/
})
ipcMain.handle("requestUpdateRow", async (event, data: { uuid: number, newRowData: NewRowData }) => {
	if (process.env.NODE_ENV === "development") {
		console.log(`ipcMain||updateRow||${JSON.stringify(data)}`)
	}
	return await updateRow({ uuid: data.uuid, newRowData: data.newRowData })
	/*event.reply("responseUpdateRow", await updateRow({ uuid: data.uuid, newRowData: data.newRowData }))*/
})

ipcMain.handle("requestSteamActiveUser", async (event) => {
	if (process.env.NODE_ENV === "development") {
		console.log(`ipcMain||steamActiveUser`)
	}
	return await getSteamProcess()
	/*event.reply("responseSteamActiveUser", await getSteamProcess())*/
})

ipcMain.handle("requestSteamChangeUser", async (event, data: { username: string }) => {
	if (process.env.NODE_ENV === "development") {
		console.log(`ipcMain||requestSteamChangeUser`)
	}

	if (winUsers.includes(data.username)) {
		if ((await getSteamProcess()).running) {
			await shutDownSteam()
		}
		return await runasUser(data.username)
		/*event.reply("responseSteamChangeUser", await runasUser(data.username))*/
	}
})
ipcMain.handle("requestSteamShutdown", async (event) => {
	if (process.env.NODE_ENV === "development") {
		console.log(`ipcMain||requestSteamShutdown`)
	}
	return await shutDownSteam()
	/*event.reply("responseSteamShutdown", await shutDownSteam())*/
})

ipcMain.handle("requestValidateNewRow", async (event, data: NewRowData) => {
	if (process.env.NODE_ENV === "development") {
		console.log(`ipcMain||requestValidateNewRow`)
	}
	return validateNewRow(data)
})