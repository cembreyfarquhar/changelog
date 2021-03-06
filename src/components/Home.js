import React, { useEffect, useState, useLayoutEffect } from "react";
import axios from "axios";
import { withCookies, useCookies } from "react-cookie";
import Header from "./Header";
import ChangeLog from "./ChangeLog";
import ModalChangeLog from "./ModalChangeLog";
import Modal from "react-modal";

Modal.setAppElement(document.getElementById("root"));

function Home() {
  // Notifications-Modal styles
  const modalStyles = {
    content: {
      top: "10%",
      left: "auto",
      right: "25%",
      bottom: "auto",
      width: "300px",
      height: "350px"
    }
  };

  const [hasMounted, setHasMounted] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [allChanges, setAllChanges] = useState([]);

  const [newChanges, setNewChanges] = useState([]);

  const [notifNumber, setNotifNumber] = useState(0);

  const [seenIds, setSeenIds] = useState([]);

  const [cookies, setCookie] = useCookies([]);

  useEffect(() => {
    async function fetchChanges() {
      try {
        const { data } = await axios.get(
          "https://gist.githubusercontent.com/cembreyfarquhar/76bf4cb38fe04cdd4da3b3ca34157ff1/raw/5ca42c065c4eb4a9e8190dc81e2cde587ddc4b80/gistfile1.md"
        );
        const dataArray = data.split("\n## ").slice(1);

        const formattedData = dataArray
          .reverse()
          .map((text, index) => {
            const title = text.slice(0, text.indexOf("\n"));
            text = text.replace(title, "");
            const date = text.match(/\d\d\/\d\d\/\d\d\d\d/)[0];
            text = text.replace(date, "");
            const label = text.slice(text.indexOf("["), text.indexOf("]") + 1);
            text = text.replace(label, "");
            const content = text.slice(4, text.indexOf("####")).split("\n");
            const link = text.slice(text.indexOf("https://"));
            text = text.replace(link, "");
            const extra = text
              .slice(text.indexOf("####"))
              .replace("additional info", "");
            return {
              title,
              date,
              label,
              content,
              link,
              id: index,
              extra,
              read: false
            };
          })
          .reverse();

        // Splits data at each new change and adds the correct MD formatting back in. Also removes the first element (Recent Changes)
        setAllChanges(formattedData);

        // Get ids of each cookie,
        const ids = Object.keys(cookies).map(id => {
          if (!isNaN(parseInt(id))) {
            return parseInt(id);
          } else {
            return null;
          }
        });

        const notInCookies = formattedData
          .filter(change => {
            return !ids.includes(change.id);
          })
          .map(change => {
            return {
              ...change,
              read: false
            };
          });
        setNewChanges(allChanges);
        setNotifNumber(notInCookies.length);
      } catch (error) {
        console.error("Error fetching changes");
      }
    }

    fetchChanges();
  }, [cookies, setNewChanges]);

  useLayoutEffect(() => {
    if (!hasMounted) {
      setNotifNumber(newChanges.length);
      setHasMounted(true);
    }
  }, [newChanges]);

  function openModal() {
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function clearNotification(id) {
    console.log(id);
    if (notifNumber > 0 && !seenIds.includes(id)) {
      setNotifNumber(notifNumber - 1);
    }
    setSeenIds([...seenIds, id]);
    setCookie(`${id}`);
  }

  if (!allChanges.length) {
    return <h1>Loading...</h1>;
  }

  return (
    <div className="home">
      <Header openModal={openModal} notifNumber={notifNumber} />
      <Modal
        isOpen={modalOpen}
        onRequestClose={closeModal}
        style={modalStyles}
        contentLabel="New features and changes"
      >
        <ModalChangeLog
          clearNotification={clearNotification}
          changes={allChanges}
        />
      </Modal>
      <ChangeLog changes={allChanges} />
    </div>
  );
}

export default withCookies(Home);
