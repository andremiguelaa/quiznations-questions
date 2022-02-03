import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import readXlsxFile from 'read-excel-file';

import classes from './App.module.scss';

const parseQuestions = (data) =>
  data.reduce((acc, question) => {
    if (!acc[question[1]]) {
      acc[question[1]] = [];
    }
    acc[question[1]].push({
      question: question[2],
      answer: question[3],
    });
    return acc;
  }, {});

const App = () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const game = urlParams.get('game');
  const questionsFile = urlParams.get('questions');

  const [timer, setTimer] = useState(0);
  const interval = useRef();

  const [questions, setQuestions] = useState({
    packet1: {},
    packet2: {},
  });

  const [packet, setPacket] = useState(1);
  const [topic, setTopic] = useState();

  const stopTimer = () => {
    clearInterval(interval.current);
    setTimer(0);
  };

  const startTimer = (seconds) => {
    stopTimer();
    setTimer(seconds);
    interval.current = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          stopTimer();
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    axios({
      url: questionsFile,
      method: 'GET',
      responseType: 'blob',
    }).then((response) => {
      const file = new Blob([response.data]);
      readXlsxFile(file, { sheet: 1 }).then((data) => {
        data.shift();
        setQuestions((questions) => ({
          ...questions,
          packet1: parseQuestions(data),
        }));
      });
      readXlsxFile(file, { sheet: 2 }).then((data) => {
        data.shift();
        setQuestions((questions) => ({
          ...questions,
          packet2: parseQuestions(data),
        }));
      });
    });
  }, [questionsFile]);

  return (
    <div className={classes.app}>
      <iframe className={classes.iframe} title="game" src={game} />
      <div className={classes.controls}>
        <div className={classes.timer}>
          <div className={classes.count}>
            00:{timer.toString().padStart(2, '0')}
          </div>
          <div>
            <button onClick={() => startTimer(20)}>
              Individual (20s) &#9658;
            </button>
            <button onClick={() => startTimer(30)}>Equipa (30s) &#9658;</button>
            <button onClick={() => stopTimer()}>&#9632;</button>
          </div>
        </div>
        <div className={classes.packetChoose}>
          {topic ? (
            <button onClick={() => setTopic()} className={classes.back}>
              &#9664; Voltar para os temas
            </button>
          ) : (
            <>
              <button onClick={() => setPacket(1)} disabled={packet === 1}>
                Primeira parte
              </button>
              <button onClick={() => setPacket(2)} disabled={packet === 2}>
                Segunda parte
              </button>
            </>
          )}
        </div>
        {topic ? (
          <div className={classes.topic}>
            {questions[`packet${packet}`][topic].map((item, index) => (
              <div key={item.question} className={classes.question}>
                <strong>Pergunta {index + 1}:</strong>
                <br />
                <br />
                {item.question}
                <br />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.question);
                  }}
                >
                  Copiar enunciado
                </button>
                <br />
                <br />
                <strong>Resposta:</strong>
                <br />
                <br />
                {item.answer}
                <br />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.answer);
                  }}
                >
                  Copiar resposta
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={classes.questions}>
            <ul>
              {Object.keys(questions[`packet${packet}`]).map((item) => (
                <li key={item} onClick={() => setTopic(item)}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
