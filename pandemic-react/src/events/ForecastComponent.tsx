import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { destroyEvent } from "../Subscriptions";

const reorder = (list: string[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const getItemStyle = (
  isDragging: boolean,
  draggableStyle: any,
  backgroundColor: string
) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: "none",
  // change background colour if dragging
  backgroundColor: backgroundColor,
  // styles we need to apply on draggables
  ...draggableStyle,
});

const getListStyle = (isDraggingOver: boolean) => ({
  background: isDraggingOver ? "lightblue" : "lightgrey",
  display: "flex",
  overflow: "auto",
});

interface ForecastComponentProps {
  game: Client.Game;
  socket: SocketIOClient.Socket;
}

interface ForecastComponentState {
  orderedCards: string[];
}

export class ForecastComponent extends React.Component<
  ForecastComponentProps,
  ForecastComponentState
> {
  constructor(props: ForecastComponentProps) {
    super(props);
    if (props.game.top_6_infection_cards) {
      this.state = {
        orderedCards: [...props.game.top_6_infection_cards],
      };
    }
    this.onSubmit = this.onSubmit.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  onDragEnd(result: DropResult) {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const orderedCards = reorder(
      this.state.orderedCards,
      result.source.index,
      result.destination.index
    );

    this.setState({
      orderedCards,
    });
  }

  onSubmit() {
    const { socket } = this.props;
    const { orderedCards } = this.state;

    socket.emit(Client.EventName.Forecasting, orderedCards);
    destroyEvent();
  }

  render() {
    const { game } = this.props;
    return (
      <>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "80%",
          }}
        >
          <span>Next to draw</span>
          <span>Last to draw</span>
        </div>
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId="droppable" direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                style={getListStyle(snapshot.isDraggingOver)}
                {...provided.droppableProps}
              >
                {this.state.orderedCards.map((item, index) => (
                  <Draggable
                    key={`draggable-item-${item}`}
                    draggableId={item}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        className="card"
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(
                          snapshot.isDragging,
                          provided.draggableProps.style,
                          game.game_graph_index[item] !== undefined
                            ? game.game_graph[game.game_graph_index[item]].color
                            : "white"
                        )}
                      >
                        <div className="card-text">{item}</div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <button onClick={this.onSubmit}>Submit Reordering</button>
      </>
    );
  }
}
