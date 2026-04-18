import { Container, Row, Col } from "react-bootstrap";
import Navbar_comp from "../Hero_page/navbar";
import Signup_form from "./Signup_form";
import "../Styles/Signup_form.css";

function Signup() {
    return (
        <div className="signup-page-wrapper min-vh-100 overflow-hidden">
            <div className="position-absolute top-0 w-100 z-3">
                <Navbar_comp />
            </div>

            <Container fluid className="signup-shell p-0">
                <Row className="g-0 min-vh-100 align-items-center justify-content-center px-3 px-md-4">
                    <Col xs={12} md={8} lg={5} xl={4} className="d-flex justify-content-center py-5">
                        <Signup_form />
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Signup;