import "regenerator-runtime/runtime";
import React from "react"
import { render } from "react-dom"
import Main from "./components/Main"

const mainElement = document.createElement("div")
mainElement.setAttribute("id", "root")
document.body.appendChild(mainElement)

const App = () => {
	return (
		<React.StrictMode >
			<Main />
		</React.StrictMode>
	)
}

render(<App />, mainElement)
