import { Button, Container } from "react-bootstrap"
import '../Styles/Login_form.css'
function Login_form() {
    return(
        <Container fluid className="">
            <div className=" mb-5">
        <h1>WELCOME BACK!</h1>
        <p>Digitally connect your entire distribution network and make 
faster, data-driven decisions from production to the retail shelf. </p>
            </div>
            <div className="d-flex flex-column form_input align-items-center">
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
        <Button style={{padding: "0.5rem 4rem", backgroundColor: "#F3D948"}} className=" rounded-pill border-white">Login</Button>
            </div>
        </Container>

    )
}

export default Login_form