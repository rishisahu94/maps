/* eslint-disable no-undef */
/* eslint no-use-before-define: 0 */ // --> OFF
/* eslint-disable no-use-before-define */
import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

import MapView, {
  MAP_TYPES,
  Polygon,
  ProviderPropType,
  Marker,
  UrlTile,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
let id = 0;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: 0.009,
        longitudeDelta: 0.009,
      },
      polygons: [],
      editing: null,
      creatingHole: false,
    };
  }

  componentDidMount() {
    // eslint-disable-next-line no-undef
    XMLHttpRequest = GLOBAL.originalXMLHttpRequest
      ? GLOBAL.originalXMLHttpRequest
      : GLOBAL.XMLHttpRequest;

    // fetch logger
    global._fetch = fetch;
    global.fetch = function (uri, options, ...args) {
      return global._fetch(uri, options, ...args).then((response) => {
        console.log('Fetch', {request: {uri, options, ...args}, response});
        return response;
      });
    };
  }

  finish() {
    const {polygons, editing} = this.state;
    this.setState({
      polygons: [...polygons, editing],
      editing: null,
      creatingHole: false,
    });
  }

  clear = () => {
    this.setState({
      polygons: [],
      editing: null,
      creatingHole: false,
    });
  };

  createHole() {
    const {editing, creatingHole} = this.state;
    if (!creatingHole) {
      this.setState({
        creatingHole: true,
        editing: {
          ...editing,
          holes: [...editing.holes, []],
        },
      });
    } else {
      const holes = [...editing.holes];
      if (holes[holes.length - 1].length === 0) {
        holes.pop();
        this.setState({
          editing: {
            ...editing,
            holes,
          },
        });
      }
      this.setState({creatingHole: false});
    }
  }

  onPress(e) {
    console.log(this.state.polygons);
    const {editing, creatingHole} = this.state;
    if (!editing) {
      this.setState({
        editing: {
          id: id++,
          coordinates: [e.nativeEvent.coordinate],
          holes: [],
        },
      });
    } else if (!creatingHole) {
      this.setState({
        editing: {
          ...editing,
          coordinates: [...editing.coordinates, e.nativeEvent.coordinate],
        },
      });
    } else {
      const holes = [...editing.holes];
      holes[holes.length - 1] = [
        ...holes[holes.length - 1],
        e.nativeEvent.coordinate,
      ];
      this.setState({
        editing: {
          ...editing,
          id: id++, // keep incrementing id to trigger display refresh
          coordinates: [...editing.coordinates],
          holes,
        },
      });
    }
  }

  render() {
    console.log('this.state.polygons', this.state.polygons);
    const mapOptions = {
      scrollEnabled: true,
    };

    if (this.state.editing) {
      mapOptions.scrollEnabled = false;
      mapOptions.onPanDrag = (e) => this.onPress(e);
    }

    return (
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          mapType={MAP_TYPES.SATELLITE}
          initialRegion={this.state.region}
          onPress={(e) => this.onPress(e)}
          {...mapOptions}>
          {this.state.polygons.map((polygon) => (
            <Polygon
              key={polygon.id}
              coordinates={polygon.coordinates}
              holes={polygon.holes}
              strokeColor="#F00"
              fillColor="rgba(255,0,0,0.5)"
              strokeWidth={1}
            />
          ))}
          {this.state.editing && (
            <Polygon
              key={this.state.editing.id}
              coordinates={this.state.editing.coordinates}
              holes={this.state.editing.holes}
              strokeColor="#000"
              fillColor="rgba(255,0,0,0.5)"
              strokeWidth={1}
            />
          )}

          <UrlTile
            urlTemplate={
              'https://appstore.agritech-dev.cloud.arv.co.th/api/satellite-tiler/tiles/${date}/${ndviRgbSelector}/{z}/{x}/{y}.png'
            }
            headers={{
              'access-token':
                'eyJraWQiOiI0d3ZoYlBjVUZFazlNRDhcL0tDYVVjcTdEQ2V1UjdxOFoxd2ZoXC9RVG5Rbm89IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiI3OGE3MThmZC1jMDhiLTRiZDQtOTU1ZC1kN2ZjMWNkNGFlY2EiLCJkZXZpY2Vfa2V5IjoiYXAtc291dGhlYXN0LTFfZjBiOGJkNjQtY2RiOC00YjY5LWFiZTQtODY0NjA4NDgxOWUyIiwiY29nbml0bzpncm91cHMiOlsiU2FsZXNSZXByZXNlbnRhdGl2ZXMiXSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmFwLXNvdXRoZWFzdC0xLmFtYXpvbmF3cy5jb21cL2FwLXNvdXRoZWFzdC0xX05ZOVd1QnljVSIsImNsaWVudF9pZCI6IjFtaDRpa2l2cmo1OHAwZTcwaGYxMDExbjRsIiwiZXZlbnRfaWQiOiI5MmY4YmU2Yi0yMjk3LTQwNGItOGFlYy04NTZhNTFlNDZlMTYiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIiwiYXV0aF90aW1lIjoxNjA0MDU0NzYwLCJleHAiOjE2MDQwNTgzNjAsImlhdCI6MTYwNDA1NDc2MSwianRpIjoiZTZjZTBjNDAtY2NlMy00YTJmLTg5YWQtYjJjM2ZjMjcxODA3IiwidXNlcm5hbWUiOiI3OGE3MThmZC1jMDhiLTRiZDQtOTU1ZC1kN2ZjMWNkNGFlY2EifQ.dpFFv68Vwiq8eE7le3xO9oTthKkJ8dwMBGQaUfGgxz_PZenemCYveNiz0CuhnonTiMdZq4V4W69W1VmYc0KzeUP9kZss5EjRz7g64tjwXMsd7--O3sOMaidlroEDMP6vw6hf3E0-oHSEruoLbmDOtXoxJd_iMCZlZ4TKRsxkZ6gIPK8i_Bg7pQq4aNmayW-Ymme_DChnuYbxb5j6S2lsLhpWN5NIPW7EEI_WxFobsPerqPjQLu-iGqp4CQbXEe4OeUbIgNoPi--rFugYWwKiSRrZa8RS9d8GUxo90AHk7pF10f9os9hz_2yn4yd_-eHK7ZtCH1O8Eb1FM272pXL1Vg',
            }}
          />
          <Marker coordinate={{latitude: LATITUDE, longitude: LONGITUDE}} />
        </MapView>

        <View style={styles.buttonContainer}>
          {this.state.editing && (
            <TouchableOpacity
              onPress={() => this.createHole()}
              style={[styles.bubble, styles.button]}>
              <Text>
                {this.state.creatingHole ? 'Finish Hole' : 'Create Hole'}
              </Text>
            </TouchableOpacity>
          )}
          {this.state.editing && (
            <TouchableOpacity
              onPress={() => this.finish()}
              style={[styles.bubble, styles.button]}>
              <Text>Finish</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => this.clear()}
          style={[styles.bubble, styles.button]}>
          <Text>Clear</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  latlng: {
    width: 200,
    alignItems: 'stretch',
  },
  button: {
    width: 80,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
});

export default App;
