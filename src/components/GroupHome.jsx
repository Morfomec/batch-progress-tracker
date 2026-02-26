import { useParams } from "react-router-dom";


function GroupHome() {
    const { groupId } = useParams();

    return (
        <div>
            <h1>Group Dashboard</h1>
        </div>
    );
}