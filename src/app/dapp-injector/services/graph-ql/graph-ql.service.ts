import { Injectable } from '@angular/core';
import { Apollo, QueryRef, gql } from 'apollo-angular';
import { firstValueFrom, Subscription } from 'rxjs';



const GET_QUERY = `
  query($receiver: String!){
    streams(where:{
          receiver: $receiver
        }
       ) {
    	token {
        id
        symbol
      }
      createdAtTimestamp
	    updatedAtTimestamp
	    currentFlowRate
	    streamedUntilUpdatedAt
        }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class GraphQlService {
  loading!: boolean;
  posts: any;
   postsQuery!: QueryRef<any>;
  // private querySubscription!: Subscription;
  constructor(private apollo: Apollo) {}
  
  
 async  query(address:string) {
    // this.postsQuery = this.apollo.watchQuery<any>({
    //   query: GET_POSTS,
    //   pollInterval: 500,
    // });
    console.log(address)
    const variables = {receiver: address.toLowerCase()};
  const posts = await firstValueFrom(this.apollo.query<any>({
    query: gql(GET_QUERY),
    variables,
    }))

    return posts.data


    // this.querySubscription = this.postsQuery.valueChanges.subscribe(({ data, loading }) => {
    //   this.loading = loading;
    //   this.posts = data.posts;
    // });
  }
}
